import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import Groq from "groq-sdk";

const groqApiKey = defineSecret("GROQ_API_KEY");
const pexelsApiKey = defineSecret("PEXELS_API_KEY");
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://hsmocap-d907e.web.app",
  "https://hsmocap-d907e.firebaseapp.com",
]);

const previewChannelOriginPattern =
  /^https:\/\/hsmocap-d907e--[a-z0-9-]+(?:-[a-z0-9]+)?\.web\.app$/i;

const isAllowedOrigin = (origin?: string | null) =>
  !!origin && (allowedOrigins.has(origin) || previewChannelOriginPattern.test(origin));

initializeApp();
const firestore = getFirestore();

type GradeWordAnswerRequest = {
  english: string;
  korean: string;
  targetWord: string;
  wordMeaning: string;
  acceptableAnswers: string[];
  correctAnswer: string;
  userAnswer: string;
};

type GradeWordAnswerResponse = {
  isCorrect: boolean;
  verdict: "correct" | "correct_but_unnatural" | "close" | "incorrect" | "empty";
  message: string;
  hint?: string;
  matchedAnswer?: string;
};

type ImageHintRequest = {
  targetWord: string;
  english?: string;
  wordMeaning?: string;
};

type ImageHintResponse = {
  imageUrl: string;
  descriptionUrl: string;
  title: string;
};

type IncrementPostViewRequest = {
  postId: string;
};

const SYSTEM_PROMPT = [
  "You are a Korean vocabulary grading assistant.",
  "Judge the user's Korean answer for the highlighted English target word using the full English sentence, full Korean sentence, target word, and meaning.",
  "Be generous. Mark isCorrect=true and verdict='correct' when the user's answer has substantially the same meaning as the expected Korean expression in the sentence, even if wording, spacing, nuance, register, particle choice, minor typo, or awkward expression differs.",
  "Treat Korean typos, spacing mistakes, particle mistakes, ending differences, archaic wording, unusual wording, and understandable malformed expressions as correct when a Korean speaker can still understand the intended meaning.",
  "Consider Korean cultural and linguistic context. If the user's interpretation would normally be understood as close enough in Korean usage, accept it.",
  "Prefer semantic understanding over literal surface matching.",
  "Treat synonyms, near-synonyms, polite/casual ending differences, particles, archaic wording, and small wording differences as correct when the sentence meaning is preserved.",
  "Treat natural Korean paraphrases as correct when they preserve the sentence-level meaning, even if they are not dictionary-like translations.",
  "Accept sentence-form rewrites, softer or stronger endings, and natural Korean rephrasings when the highlighted word plays the same role in context.",
  "If the expected answer is phrase-like but the user gives a natural sentence expression with the same intent, prefer correct over close.",
  "If the user's answer is slightly broader or slightly less literal but still clearly points to the same intended action or meaning in context, accept it.",
  "Use verdict='correct_but_unnatural' when the meaning is correct but the wording is noticeably less natural than the common answer.",
  "Use verdict='close' only when the answer is related but still misses part of the intended meaning.",
  "Use verdict='incorrect' when the meaning is different in the sentence.",
  "Use verdict='empty' only when the user answer is blank.",
  "Return only one verdict token: correct, correct_but_unnatural, close, incorrect, or empty.",
].join(" ");

const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

const normalizeAnswerForComparison = (value: string) =>
  normalize(value)
    .replace(/[.,!?'"`~]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

const stripKoreanSuffixes = (value: string) => {
  const suffixes = [
    "입니다",
    "이에요",
    "예요",
    "이야",
    "야",
    "입니다",
    "니다",
    "다",
    "요",
    "죠",
    "네",
    "까",
    "니",
    "냐",
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "에",
    "에서",
    "와",
    "과",
    "도",
    "만",
    "로",
    "으로",
  ];

  let result = normalizeAnswerForComparison(value);
  let changed = true;
  while (changed && result.length > 1) {
    changed = false;
    for (const suffix of suffixes) {
      if (result.endsWith(suffix) && result.length > suffix.length + 1) {
        result = result.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }
  return result;
};

const buildComparisonVariants = (value: string) => {
  const normalized = normalizeAnswerForComparison(value);
  const stripped = stripKoreanSuffixes(value);
  return Array.from(new Set([normalized, stripped].filter(Boolean)));
};

const isAcceptableMatch = (userAnswer: string, acceptableAnswers: string[]) => {
  const userVariants = buildComparisonVariants(userAnswer);
  return acceptableAnswers.find((answer) => {
    const answerVariants = buildComparisonVariants(answer);
    return userVariants.some((userVariant) => answerVariants.includes(userVariant));
  });
};

const buildUserPrompt = (request: GradeWordAnswerRequest) =>
  [
    "Grade this answer.",
    `English sentence: ${request.english}`,
    `Korean sentence with blank target meaning: ${request.korean}`,
    `Highlighted English target word: ${request.targetWord}`,
    `Dictionary meaning of the target word: ${request.wordMeaning}`,
    `Reference acceptable answers: ${request.acceptableAnswers.join(", ")}`,
    `Canonical answer: ${request.correctAnswer}`,
    `User answer: ${request.userAnswer}`,
    "Return only one verdict token from this list:",
    "correct",
    "correct_but_unnatural",
    "close",
    "incorrect",
    "If the user's answer means almost the same thing in this sentence, prefer correct over close.",
    "If the user's answer means the same thing in this sentence, accept it as correct even if it is not listed in reference acceptable answers.",
    "Minor Korean typos, spacing errors, awkward particles, and understandable malformed expressions should usually still be accepted.",
    "Natural Korean sentence rewrites should also be accepted when the sentence meaning is preserved.",
    "For example, sentence-level variants such as obligation, focus, targeting, or phrasing changes can still be correct if they express the same idea in context.",
  ].join("\n");

const calculateSimilarity = (source: string, target: string): number => {
  if (!source && !target) {
    return 1;
  }

  const matrix = Array.from({ length: target.length + 1 }, () => Array(source.length + 1).fill(0));
  for (let index = 0; index <= source.length; index += 1) {
    matrix[0][index] = index;
  }
  for (let index = 0; index <= target.length; index += 1) {
    matrix[index][0] = index;
  }

  for (let row = 1; row <= target.length; row += 1) {
    for (let column = 1; column <= source.length; column += 1) {
      const cost = source[column - 1] === target[row - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row][column - 1] + 1,
        matrix[row - 1][column] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  const distance = matrix[target.length][source.length];
  return 1 - distance / Math.max(source.length, target.length, 1);
};

const buildFallbackFeedback = (
  userAnswer: string,
  correctAnswer: string,
  targetWord: string,
  wordMeaning: string,
): GradeWordAnswerResponse => {
  const similarity = Math.max(
    ...buildComparisonVariants(userAnswer).flatMap((userVariant) =>
      buildComparisonVariants(correctAnswer).map((correctVariant) =>
        calculateSimilarity(userVariant, correctVariant),
      ),
    ),
  );
  if (similarity >= 0.88) {
    return {
      isCorrect: true,
      verdict: "correct",
      message: "정답입니다!",
      hint: undefined,
      matchedAnswer: correctAnswer,
    };
  }

  if (similarity >= 0.6) {
    return {
      isCorrect: true,
      verdict: "correct_but_unnatural",
      message: "의미는 맞습니다.",
      hint: `더 자연스러운 표현은 '${correctAnswer}'입니다.`,
    };
  }

  return {
    isCorrect: false,
    verdict: "incorrect",
    message: "틀렸습니다. 다시 생각해보세요.",
    hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
  };
};

const buildFeedbackFromVerdict = (
  verdict: GradeWordAnswerResponse["verdict"],
  targetWord: string,
  wordMeaning: string,
  correctAnswer: string,
): GradeWordAnswerResponse => {
  switch (verdict) {
    case "correct":
      return {
        isCorrect: true,
        verdict,
        message: "정답입니다!",
        hint: undefined,
        matchedAnswer: correctAnswer,
      };
    case "correct_but_unnatural":
      return {
        isCorrect: true,
        verdict,
        message: "의미는 맞습니다.",
        hint: `더 자연스러운 표현은 '${correctAnswer}'입니다.`,
        matchedAnswer: correctAnswer,
      };
    case "close":
      return {
        isCorrect: false,
        verdict,
        message: "거의 맞았어요.",
        hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다. 문장에 더 자연스럽게 맞춰보세요.`,
      };
    case "empty":
      return {
        isCorrect: false,
        verdict,
        message: "답을 입력해주세요.",
        hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다.`,
      };
    case "incorrect":
    default:
      return {
        isCorrect: false,
        verdict: "incorrect",
        message: "틀렸습니다. 다시 생각해보세요.",
        hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
      };
  }
};

const extractVerdict = (value: string): GradeWordAnswerResponse["verdict"] => {
  const lowered = value.trim().toLowerCase();
  if (lowered.includes("correct_but_unnatural")) {
    return "correct_but_unnatural";
  }
  if (lowered.includes("correct")) {
    return "correct";
  }
  if (lowered.includes("close")) {
    return "close";
  }
  if (lowered.includes("empty")) {
    return "empty";
  }
  return "incorrect";
};

const createCorsHeaders = (origin?: string | null) => ({
  "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "http://localhost:5173",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

type PexelsPhoto = {
  id?: number;
  width?: number;
  height?: number;
  url?: string;
  alt?: string;
  photographer?: string;
  src?: {
    large2x?: string;
    large?: string;
    medium?: string;
    original?: string;
  };
};

const ENGLISH_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "she",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "us",
  "we",
  "you",
  "your",
]);

const TEXT_HEAVY_HINTS = [
  "alphabet",
  "caption",
  "font",
  "headline",
  "letter",
  "letters",
  "logo",
  "scrabble",
  "sign",
  "subtitle",
  "text",
  "typography",
  "word",
  "words",
  "writing",
];

const tokenizeEnglish = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/g)
    .filter((token) => token.length > 1 && !ENGLISH_STOPWORDS.has(token));

const buildImageQueries = (targetWord: string, english?: string, wordMeaning?: string) => {
  const normalizedTarget = targetWord.trim().replace(/\s+/g, " ");
  const normalizedEnglish = (english ?? "").trim().replace(/\s+/g, " ");
  const compactMeaning = (wordMeaning ?? "")
    .replace(/[()]/g, " ")
    .split(/[,\s/]+/g)
    .filter((part) => part.length >= 2)
    .slice(0, 2)
    .join(" ");
  const quoted = normalizedTarget.includes(" ") ? `"${normalizedTarget}"` : normalizedTarget;
  const contextTail = tokenizeEnglish(normalizedEnglish).slice(0, 4).join(" ");

  return Array.from(
    new Set(
      [
        `${quoted} realistic photo`,
        `${quoted} ${contextTail}`.trim(),
        `${quoted} ${compactMeaning}`.trim(),
        `${quoted} people action`,
      ]
        .map((query) => query.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  );
};

const fetchPexelsCandidates = async (
  queryText: string,
  apiKey: string,
  perPage = 20,
): Promise<PexelsPhoto[]> => {
  const endpoint = new URL("https://api.pexels.com/v1/search");
  endpoint.search = new URLSearchParams({
    query: queryText,
    per_page: String(perPage),
    orientation: "landscape",
  }).toString();

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    photos?: PexelsPhoto[];
  };

  return data.photos ?? [];
};

const includesAnyTerm = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const scorePexelsPhoto = (
  photo: PexelsPhoto,
  targetWord: string,
  english: string,
  wordMeaning: string,
) => {
  const alt = (photo.alt ?? "").toLowerCase().trim();
  const normalizedTarget = targetWord.toLowerCase().trim();
  const targetTokens = tokenizeEnglish(targetWord);
  const contextTokens = tokenizeEnglish(english).filter((token) => !targetTokens.includes(token)).slice(0, 5);
  const meaningTokens = wordMeaning
    .toLowerCase()
    .split(/[,\s/]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 2);

  let score = 0;
  const reasons: string[] = [];

  if (!alt) {
    score -= 5;
    reasons.push("missing-alt");
  } else {
    if (alt.includes(normalizedTarget)) {
      score += 30;
      reasons.push("exact-target");
    }

    const matchedTargetTokens = targetTokens.filter((token) => alt.includes(token)).length;
    score += matchedTargetTokens * 10;
    if (matchedTargetTokens > 0) {
      reasons.push("target-token");
    }

    const matchedContextTokens = contextTokens.filter((token) => alt.includes(token)).length;
    score += matchedContextTokens * 4;
    if (matchedContextTokens > 0) {
      reasons.push("context-token");
    }

    const matchedMeaningTokens = meaningTokens.filter((token) => alt.includes(token)).length;
    score += matchedMeaningTokens * 6;
    if (matchedMeaningTokens > 0) {
      reasons.push("meaning-token");
    }

    if (includesAnyTerm(alt, TEXT_HEAVY_HINTS)) {
      score -= 35;
      reasons.push("text-heavy");
    }
  }

  const width = photo.width ?? 0;
  const height = photo.height ?? 0;
  if (width >= 1000 && height >= 700) {
    score += 3;
    reasons.push("high-res");
  }

  return {
    score,
    reasons,
  };
};

export const gradeWordAnswerHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    secrets: [groqApiKey],
    cors: true,
  },
  async (request, response): Promise<void> => {
    let fallbackUserAnswer = "";
    let fallbackCorrectAnswer = "";
    let fallbackTargetWord = "";
    let fallbackWordMeaning = "";

    try {
      const origin = request.headers.origin;
      const corsHeaders = createCorsHeaders(origin);

      if (request.method === "OPTIONS") {
        response.status(204).set(corsHeaders).send("");
        return;
      }

      if (request.method !== "POST") {
        response.status(405).set(corsHeaders).json({ error: "Method not allowed." });
        return;
      }

      if (!isAllowedOrigin(origin)) {
        response.status(403).set(corsHeaders).json({ error: "Origin is not allowed." });
        return;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      try {
        await getAuth().verifyIdToken(authHeader.slice("Bearer ".length));
      } catch {
        response.status(401).set(corsHeaders).json({ error: "Invalid auth token." });
        return;
      }

      const data = request.body as Partial<GradeWordAnswerRequest>;
      const english = typeof data.english === "string" ? normalize(data.english) : "";
      const korean = typeof data.korean === "string" ? normalize(data.korean) : "";
      const targetWord = typeof data.targetWord === "string" ? normalize(data.targetWord) : "";
      const wordMeaning = typeof data.wordMeaning === "string" ? normalize(data.wordMeaning) : "";
      const correctAnswer = typeof data.correctAnswer === "string" ? normalize(data.correctAnswer) : "";
      const userAnswer = typeof data.userAnswer === "string" ? normalize(data.userAnswer) : "";
      fallbackUserAnswer = userAnswer;
      fallbackCorrectAnswer = correctAnswer;
      fallbackTargetWord = targetWord;
      fallbackWordMeaning = wordMeaning;
      const acceptableAnswers = Array.isArray(data.acceptableAnswers)
        ? data.acceptableAnswers
            .filter((answer): answer is string => typeof answer === "string")
            .map(normalize)
            .filter(Boolean)
        : [];

      if (!english || !korean || !targetWord || !wordMeaning || !correctAnswer || acceptableAnswers.length === 0) {
        response.status(400).set(corsHeaders).json({ error: "Quiz context is incomplete." });
        return;
      }

      if (!userAnswer) {
        response.status(200).set(corsHeaders).json({
          isCorrect: false,
          verdict: "empty",
          message: "답을 입력해주세요.",
          hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다.`,
        } satisfies GradeWordAnswerResponse);
        return;
      }

      const normalizedAnswer = normalize(userAnswer);
      const exactMatch =
        acceptableAnswers.find((answer) => answer === normalizedAnswer) ??
        isAcceptableMatch(userAnswer, acceptableAnswers);
      if (exactMatch) {
        response.status(200).set(corsHeaders).json({
          isCorrect: true,
          verdict: "correct",
          message: `정답입니다! '${targetWord}'를 이 문맥에서 '${exactMatch}'로 표현할 수 있습니다.`,
          matchedAnswer: exactMatch,
        } satisfies GradeWordAnswerResponse);
        return;
      }

      const client = new Groq({ apiKey: groqApiKey.value() });
      const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0,
        max_completion_tokens: 20,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildUserPrompt({
              english,
              korean,
              targetWord,
              wordMeaning,
              acceptableAnswers,
              correctAnswer,
              userAnswer,
            }),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        response.status(200).set(corsHeaders).json(
          buildFallbackFeedback(userAnswer, correctAnswer, targetWord, wordMeaning),
        );
        return;
      }

      const verdict = extractVerdict(content);
      response.status(200).set(corsHeaders).json(
        buildFeedbackFromVerdict(verdict, targetWord, wordMeaning, correctAnswer),
      );
    } catch (error) {
      console.error("gradeWordAnswerHttp failed:", error);
      response.status(200).json(
        buildFallbackFeedback(
          fallbackUserAnswer,
          fallbackCorrectAnswer,
          fallbackTargetWord,
          fallbackWordMeaning,
        ),
      );
    }
  },
);

export const imageHintSearchHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 15,
    memory: "256MiB",
    secrets: [pexelsApiKey],
    cors: true,
  },
  async (request, response): Promise<void> => {
    try {
      const origin = request.headers.origin;
      const corsHeaders = createCorsHeaders(origin);

      if (request.method === "OPTIONS") {
        response.status(204).set(corsHeaders).send("");
        return;
      }

      if (request.method !== "POST") {
        response.status(405).set(corsHeaders).json({ error: "Method not allowed." });
        return;
      }

      if (!isAllowedOrigin(origin)) {
        response.status(403).set(corsHeaders).json({ error: "Origin is not allowed." });
        return;
      }

      const data = request.body as Partial<ImageHintRequest>;
      const targetWord = typeof data.targetWord === "string" ? normalize(data.targetWord) : "";
      const english = typeof data.english === "string" ? normalize(data.english) : "";
      const wordMeaning = typeof data.wordMeaning === "string" ? normalize(data.wordMeaning) : "";
      const key = pexelsApiKey.value();

      if (!targetWord) {
        response.status(400).set(corsHeaders).json({ error: "targetWord is required." });
        return;
      }

      if (!key) {
        response.status(500).set(corsHeaders).json({ error: "PEXELS_API_KEY is not configured." });
        return;
      }

      const queries = buildImageQueries(targetWord, english, wordMeaning);
      const deduplicated = new Map<number | string, PexelsPhoto>();

      for (const queryText of queries) {
        const photos = await fetchPexelsCandidates(queryText, key);
        for (const photo of photos) {
          const dedupeKey = photo.id ?? `${photo.url ?? ""}:${photo.src?.medium ?? ""}`;
          if (!dedupeKey) {
            continue;
          }
          if (!deduplicated.has(dedupeKey)) {
            deduplicated.set(dedupeKey, photo);
          }
        }
      }

      const ranked = Array.from(deduplicated.values())
        .map((photo) => {
          const scored = scorePexelsPhoto(photo, targetWord, english, wordMeaning);
          return { photo, ...scored };
        })
        .sort((left, right) => right.score - left.score);

      const best = ranked[0];
      const bestImageUrl =
        best?.photo.src?.large2x ??
        best?.photo.src?.large ??
        best?.photo.src?.medium ??
        best?.photo.src?.original;
      const bestDescriptionUrl = best?.photo.url;

      if (best && best.score >= 20 && bestImageUrl && bestDescriptionUrl) {
        response.status(200).set(corsHeaders).json({
          imageUrl: bestImageUrl,
          descriptionUrl: bestDescriptionUrl,
          title: best.photo.alt?.trim() || targetWord,
        } satisfies ImageHintResponse);
        return;
      }

      response.status(404).set(corsHeaders).json({ error: "No image found." });
    } catch (error) {
      console.error("imageHintSearchHttp failed:", error);
      response.status(500).json({ error: "Image hint search failed." });
    }
  },
);

export const incrementPostViewHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    try {
      const origin = request.headers.origin;
      const corsHeaders = createCorsHeaders(origin);

      if (request.method === "OPTIONS") {
        response.status(204).set(corsHeaders).send("");
        return;
      }

      if (request.method !== "POST") {
        response.status(405).set(corsHeaders).json({ error: "Method not allowed." });
        return;
      }

      if (!isAllowedOrigin(origin)) {
        response.status(403).set(corsHeaders).json({ error: "Origin is not allowed." });
        return;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      try {
        await getAuth().verifyIdToken(authHeader.slice("Bearer ".length));
      } catch {
        response.status(401).set(corsHeaders).json({ error: "Invalid auth token." });
        return;
      }

      const data = request.body as Partial<IncrementPostViewRequest>;
      const postId = typeof data.postId === "string" ? data.postId.trim() : "";
      if (!postId) {
        response.status(400).set(corsHeaders).json({ error: "postId is required." });
        return;
      }

      await firestore.doc(`posts/${postId}`).update({
        viewCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      response.status(200).set(corsHeaders).json({ ok: true });
    } catch (error) {
      console.error("incrementPostViewHttp failed:", error);
      response.status(500).json({ error: "Post view increment failed." });
    }
  },
);

export const incrementPostLikeCount = onDocumentCreated(
  {
    document: "posts/{postId}/likes/{userId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const postId = event.params.postId;
    await firestore.doc(`posts/${postId}`).update({
      likeCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
);

export const decrementPostLikeCount = onDocumentDeleted(
  {
    document: "posts/{postId}/likes/{userId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const postId = event.params.postId;
    await firestore.doc(`posts/${postId}`).update({
      likeCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
);

export const incrementPostCommentCount = onDocumentCreated(
  {
    document: "posts/{postId}/comments/{commentId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const postId = event.params.postId;
    await firestore.doc(`posts/${postId}`).update({
      commentCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
);

export const decrementPostCommentCount = onDocumentDeleted(
  {
    document: "posts/{postId}/comments/{commentId}",
    region: "asia-northeast3",
  },
  async (event) => {
    const postId = event.params.postId;
    await firestore.doc(`posts/${postId}`).update({
      commentCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
);
