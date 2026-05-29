import { onRequest, type HttpsOptions } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import Groq from "groq-sdk";
import {
  buildFallbackFeedback,
  buildFeedbackFromVerdict,
  buildAnswerCandidates,
  buildUserPrompt,
  containsHangul,
  extractVerdict,
  normalize,
  normalizeRequest,
  SYSTEM_PROMPT,
  type GradeWordAnswerRequest,
  type GradeWordAnswerResponse,
} from "./wordGraderCore.js";

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

const gradeWordAnswerOptions: HttpsOptions = {
  region: "asia-northeast3",
  timeoutSeconds: 30,
  memory: "256MiB",
  secrets: [groqApiKey],
  cors: true,
};

type NormalizedRequest = ReturnType<typeof normalizeRequest>;

const buildExactMatchResponse = (
  targetWord: string,
  matchedAnswer: string,
): GradeWordAnswerResponse => ({
  isCorrect: true,
  verdict: "correct",
  message: `정답입니다! '${targetWord}'를 이 문맥에서 '${matchedAnswer}'로 표현할 수 있습니다.`,
  matchedAnswer,
});

const callGroqVerdict = async (request: GradeWordAnswerRequest) => {
  const client = new Groq({ apiKey: groqApiKey.value() });
  const completion = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    max_completion_tokens: 80,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(request) },
    ],
  });

  return completion.choices[0]?.message?.content;
};

const gradeNormalizedRequest = async (request: NormalizedRequest): Promise<GradeWordAnswerResponse> => {
  const {
    english,
    korean,
    targetWord,
    wordMeaning,
    acceptableAnswers,
    correctAnswer,
    userAnswer,
  } = request;

  if (!english || !korean || !targetWord || !wordMeaning || !correctAnswer || acceptableAnswers.length === 0) {
    throw new Error("Quiz context is incomplete.");
  }

  if (!userAnswer) {
    return {
      isCorrect: false,
      verdict: "empty",
      message: "답을 입력해주세요.",
      hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다.`,
    };
  }

  const answerCandidates = buildAnswerCandidates(correctAnswer, acceptableAnswers, wordMeaning);

  const exactAnswerMatch = answerCandidates.find((answer) => answer === userAnswer);
  if (exactAnswerMatch) {
    return buildExactMatchResponse(targetWord, exactAnswerMatch);
  }

  if (!containsHangul(userAnswer)) {
    return {
      isCorrect: false,
      verdict: "incorrect",
      message: "한국어 뜻을 입력해 주세요.",
      hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
    };
  }

  const llmContent = await callGroqVerdict({
    english,
    korean,
    targetWord,
    wordMeaning,
    acceptableAnswers,
    correctAnswer,
    userAnswer,
  });

  if (!llmContent) {
    return buildFallbackFeedback(userAnswer, correctAnswer, targetWord, wordMeaning, acceptableAnswers);
  }

  const verdict = extractVerdict(llmContent);
  return buildFeedbackFromVerdict(verdict, targetWord, wordMeaning, correctAnswer);
};

export const gradeWordAnswerHttpV3 = onRequest(
  gradeWordAnswerOptions,
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);
    let normalizedRequest: NormalizedRequest | null = null;

    try {
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

      normalizedRequest = normalizeRequest(request.body as Partial<GradeWordAnswerRequest>);
      const feedback = await gradeNormalizedRequest(normalizedRequest);
      response.status(200).set(corsHeaders).json(feedback);
    } catch (error) {
      console.error("gradeWordAnswerHttpV3 failed:", error);

      if (normalizedRequest) {
        response
          .status(200)
          .set(corsHeaders)
          .json(
            buildFallbackFeedback(
              normalizedRequest.userAnswer,
              normalizedRequest.correctAnswer,
              normalizedRequest.targetWord,
              normalizedRequest.wordMeaning,
              normalizedRequest.acceptableAnswers,
            ),
          );
        return;
      }

      response.status(500).set(corsHeaders).json({ error: "Failed to grade answer." });
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
