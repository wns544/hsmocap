import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import Groq from "groq-sdk";

const groqApiKey = defineSecret("GROQ_API_KEY");
const pexelsApiKey = defineSecret("PEXELS_API_KEY");
const adminBootstrapUids = defineString("ADMIN_BOOTSTRAP_UIDS", { default: "" });
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
  queryWord?: string;
  english?: string;
  wordMeaning?: string;
};

type ImageHintResponse = {
  imageUrl: string;
  descriptionUrl: string;
  title: string;
  scenePlan?: ImageHintScenePlan;
};

type ImageHintScenePlan = {
  searchPhrases: string[];
  avoidTerms: string[];
  senseSummary: string;
  sceneSummary: string;
};

type IncrementPostViewRequest = {
  postId: string;
};

type SetAdminClaimRequest = {
  targetUid: string;
  admin: boolean;
};

type AdminDeleteCommunityPostRequest = {
  postId: string;
};

type AdminUpsertWordRequest = {
  wordId?: string;
  word: string;
  meaning: string;
  level: string;
  mastery?: number;
};

type AdminDeleteWordRequest = {
  wordId: string;
};

type AdminDeleteCommunityCommentRequest = {
  postId: string;
  commentId: string;
};

type AdminResetUserDataRequest = {
  uid: string;
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

const IMAGE_HINT_SCENE_SYSTEM_PROMPT = [
  "You convert an English vocabulary quiz item into an image-search plan.",
  "Focus on the target word as it is used in the sentence, not all dictionary meanings.",
  "First identify the contextual sense of the target word in the sentence.",
  "Return a simple JSON object with keys searchPhrases, avoidTerms, senseSummary, and sceneSummary.",
  "searchPhrases must be an array of 2 to 4 short English search phrases for realistic stock-photo style image search.",
  "avoidTerms must be an array of short English terms that represent wrong senses or misleading visual results.",
  "senseSummary must be one short English phrase describing the exact meaning of the target word in this sentence.",
  "sceneSummary must be one short English sentence describing a visible scene that would help a learner infer the target meaning in context.",
  "Prefer concrete visible scenes over abstract concepts.",
  "Do not include markdown fences or commentary.",
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

const buildImageHintScenePrompt = (request: ImageHintRequest) =>
  [
    "Create an image hint plan for this quiz item.",
    `Target word: ${request.targetWord}`,
    `Search word from sentence: ${request.queryWord ?? request.targetWord}`,
    `English sentence: ${request.english ?? ""}`,
    `Dictionary meaning: ${request.wordMeaning ?? ""}`,
    "Identify the exact meaning of the target word in this sentence first.",
    "Example: for 'Can you lend me your umbrella?' the sense is 'let someone use your item temporarily' or 'lend something to someone'.",
    "Return JSON only.",
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

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const verifyBearerToken = async (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  try {
    return await getAuth().verifyIdToken(authorization.slice("Bearer ".length));
  } catch {
    return null;
  }
};

const hasBootstrapAdminAccess = (uid: string) => parseCsv(adminBootstrapUids.value()).includes(uid);

const hasAdminAccess = (decodedToken: DecodedIdToken) =>
  decodedToken.admin === true || hasBootstrapAdminAccess(decodedToken.uid);

const deleteCommunityPostAsAdmin = async (postId: string) => {
  const batch = firestore.batch();

  const [commentsSnapshot, likesSnapshot] = await Promise.all([
    firestore.collection(`posts/${postId}/comments`).get(),
    firestore.collection(`posts/${postId}/likes`).get(),
  ]);

  commentsSnapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  likesSnapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  batch.delete(firestore.doc(`posts/${postId}`));
  await batch.commit();
};

const deleteCollectionDocuments = async (path: string) => {
  const snapshot = await firestore.collection(path).get();
  if (snapshot.empty) return 0;

  let deletedCount = 0;
  const chunks = [];
  for (let index = 0; index < snapshot.docs.length; index += 450) {
    chunks.push(snapshot.docs.slice(index, index + 450));
  }

  for (const chunk of chunks) {
    const batch = firestore.batch();
    chunk.forEach((item) => {
      batch.delete(item.ref);
      deletedCount += 1;
    });
    await batch.commit();
  }

  return deletedCount;
};

const writeAdminLog = async (
  adminUid: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) => {
  await firestore.collection("adminLogs").add({
    adminUid,
    action,
    targetType,
    targetId,
    details,
    createdAt: FieldValue.serverTimestamp(),
  });
};

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
  "alphabet blocks",
  "analysis",
  "article",
  "book",
  "book cover",
  "caption",
  "chart",
  "cost benefit",
  "cost-benefit",
  "diagram",
  "dissertation",
  "document",
  "ebook",
  "font",
  "graph",
  "handwriting",
  "headline",
  "infographic",
  "journal",
  "letter",
  "letters",
  "letter blocks",
  "letter tiles",
  "logo",
  "magazine",
  "manuscript",
  "newspaper",
  "notebook",
  "page",
  "paper",
  "pdf",
  "presentation",
  "poster",
  "quote",
  "receipt",
  "report",
  "scan",
  "screenshot",
  "shop window",
  "signage",
  "scrabble",
  "spelling",
  "sign",
  "slide",
  "storefront",
  "spreadsheet",
  "subtitle",
  "table",
  "text",
  "thesis",
  "typography",
  "website",
  "whiteboard",
  "word",
  "words",
  "wooden blocks",
  "worksheet",
  "writing",
];

const POSITIVE_PHOTO_HINTS = [
  "adult",
  "animal",
  "child",
  "family",
  "hands",
  "landscape",
  "man",
  "nature",
  "outdoor",
  "people",
  "person",
  "portrait",
  "woman",
];

const ABSTRACT_IMAGE_QUERY_HINTS: Record<string, string[]> = {
  benefit: ["health benefits people", "happy healthy lifestyle", "exercise health benefits"],
  benefits: ["health benefits people", "happy healthy lifestyle", "exercise health benefits"],
  energy: ["active people exercise", "person full of energy", "healthy lifestyle energy"],
  attitude: ["person confident attitude", "positive attitude people"],
  advantage: ["winning advantage people", "success advantage person"],
  success: ["successful person celebration", "achievement happy people"],
};

const parseImageHintScenePlan = (value: string): ImageHintScenePlan | null => {
  try {
    const normalized = value.trim();
    const jsonText = normalized.startsWith("{")
      ? normalized
      : normalized.slice(normalized.indexOf("{"), normalized.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonText) as Partial<ImageHintScenePlan>;
    const searchPhrases = Array.isArray(parsed.searchPhrases)
      ? parsed.searchPhrases
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];
    const avoidTerms = Array.isArray(parsed.avoidTerms)
      ? parsed.avoidTerms
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const senseSummary = typeof parsed.senseSummary === "string" ? parsed.senseSummary.trim() : "";
    const sceneSummary = typeof parsed.sceneSummary === "string" ? parsed.sceneSummary.trim() : "";

    if (searchPhrases.length === 0) {
      return null;
    }

    return {
      searchPhrases,
      avoidTerms,
      senseSummary,
      sceneSummary,
    };
  } catch {
    return null;
  }
};

const ACTION_IMAGE_QUERY_HINTS: Record<string, string[]> = {
  invite: [
    "woman inviting friends to her house",
    "person welcoming guests at home",
    "friends visiting house invitation",
  ],
  invited: [
    "woman inviting friends to her house",
    "person welcoming guests at home",
    "friends visiting house invitation",
  ],
  lend: [
    "person lending an umbrella to another person",
    "two people sharing an umbrella outside",
    "friend borrowing umbrella in rainy weather",
  ],
  lent: [
    "person lending an umbrella to another person",
    "two people sharing an umbrella outside",
    "friend borrowing umbrella in rainy weather",
  ],
  pass: [
    "passing salt at dinner table",
    "person handing salt shaker to another person",
    "friends sharing food at table",
  ],
  passed: [
    "passing salt at dinner table",
    "person handing salt shaker to another person",
    "friends sharing food at table",
  ],
  repeat: [
    "person asking someone to repeat a word",
    "conversation listening carefully",
    "two people talking and listening",
  ],
  repeated: [
    "person asking someone to repeat a word",
    "conversation listening carefully",
    "two people talking and listening",
  ],
  catch: [
    "person catching the last bus",
    "running to board a city bus",
    "person getting on a bus in a hurry",
  ],
  caught: [
    "person catching the last bus",
    "running to board a city bus",
    "person getting on a bus in a hurry",
  ],
  travel: [
    "family traveling in spring",
    "people on a spring trip",
    "family going on vacation together",
  ],
  traveled: [
    "family traveling in spring",
    "people on a spring trip",
    "family going on vacation together",
  ],
  travelled: [
    "family traveling in spring",
    "people on a spring trip",
    "family going on vacation together",
  ],
  pay: [
    "paying for a ticket online",
    "online payment for a ticket",
    "person paying on a laptop",
  ],
  paid: [
    "paying for a ticket online",
    "online payment for a ticket",
    "person paying on a laptop",
  ],
  stop: [
    "bus stopped on the street in front of a building",
    "city bus standing still by the curb",
    "bus halted on the road",
  ],
  stopped: [
    "bus stopped on the street in front of a building",
    "city bus standing still by the curb",
    "bus halted on the road",
  ],
};

const ACTION_SCENE_HINTS: Record<string, string[]> = {
  invite: ["welcome", "guest", "guests", "friends", "family", "home", "house", "visit", "visiting"],
  invited: ["welcome", "guest", "guests", "friends", "family", "home", "house", "visit", "visiting"],
  lend: ["umbrella", "borrow", "borrowing", "sharing", "rain", "rainy", "friend", "friends", "person", "people", "hand"],
  lent: ["umbrella", "borrow", "borrowing", "sharing", "rain", "rainy", "friend", "friends", "person", "people", "hand"],
  pass: ["salt", "table", "dinner", "meal", "food", "hand", "hands", "sharing", "kitchen"],
  passed: ["salt", "table", "dinner", "meal", "food", "hand", "hands", "sharing", "kitchen"],
  repeat: ["conversation", "talking", "speaking", "listening", "discussion", "people", "person", "word"],
  repeated: ["conversation", "talking", "speaking", "listening", "discussion", "people", "person", "word"],
  catch: ["bus", "boarding", "street", "station", "stop", "running", "person", "people", "city"],
  caught: ["bus", "boarding", "street", "station", "stop", "running", "person", "people", "city"],
  travel: ["travel", "trip", "family", "people", "journey", "vacation", "outdoor", "spring"],
  traveled: ["travel", "trip", "family", "people", "journey", "vacation", "outdoor", "spring"],
  travelled: ["travel", "trip", "family", "people", "journey", "vacation", "outdoor", "spring"],
  pay: ["payment", "paying", "ticket", "online", "laptop", "computer", "checkout", "purchase"],
  paid: ["payment", "paying", "ticket", "online", "laptop", "computer", "checkout", "purchase"],
  stop: ["bus", "street", "road", "stopped", "halted", "city", "vehicle", "curb"],
  stopped: ["bus", "street", "road", "stopped", "halted", "city", "vehicle", "curb"],
};

const ACTION_INTERACTION_HINTS: Record<string, string[]> = {
  lend: ["lend", "lending", "borrow", "borrowing", "hand", "handing", "offer", "offering", "share", "sharing", "give", "giving", "use", "using"],
  lent: ["lend", "lending", "borrow", "borrowing", "hand", "handing", "offer", "offering", "share", "sharing", "give", "giving", "use", "using"],
  pass: ["pass", "passing", "hand", "handing", "give", "giving", "share", "sharing"],
  passed: ["pass", "passing", "hand", "handing", "give", "giving", "share", "sharing"],
  catch: ["catch", "caught", "board", "boarding", "run", "running", "hurry", "hurried"],
  caught: ["catch", "caught", "board", "boarding", "run", "running", "hurry", "hurried"],
  pay: ["pay", "paying", "payment", "purchase", "buy", "buying", "checkout"],
  paid: ["pay", "paying", "payment", "purchase", "buy", "buying", "checkout"],
};

const ACTION_NEGATIVE_HINTS: Record<string, string[]> = {
  lend: ["skyline", "architecture", "cityscape", "tower", "aerial", "building", "buildings"],
  lent: ["skyline", "architecture", "cityscape", "tower", "aerial", "building", "buildings"],
  pass: ["mountain", "alps", "landscape", "road", "roads", "valley", "travel", "highway", "scenic"],
  passed: ["mountain", "alps", "landscape", "road", "roads", "valley", "travel", "highway", "scenic"],
  repeat: ["alphabet", "blocks", "tiles", "scrabble", "spelling", "wooden", "letters", "typography"],
  repeated: ["alphabet", "blocks", "tiles", "scrabble", "spelling", "wooden", "letters", "typography"],
  catch: ["baseball", "stadium", "field", "sport", "glove"],
  caught: ["baseball", "stadium", "field", "sport", "glove"],
  travel: ["camera", "film", "postcard", "souvenir", "vintage"],
  traveled: ["camera", "film", "postcard", "souvenir", "vintage"],
  travelled: ["camera", "film", "postcard", "souvenir", "vintage"],
  pay: ["logo", "text", "illustration", "mockup", "poster"],
  paid: ["logo", "text", "illustration", "mockup", "poster"],
};

const CONTEXT_IMAGE_QUERY_HINTS: Record<string, string[]> = {
  password: [
    "changing password on laptop",
    "person updating account password on computer",
    "cyber security login password reset",
  ],
  salt: [
    "passing salt at dinner table",
    "handing salt shaker to another person",
  ],
  umbrella: [
    "umbrella sharing in rainy weather",
    "person handing an umbrella to another person",
  ],
  bus: [
    "city bus on the street",
    "person boarding a bus",
  ],
  bank: [
    "bus in front of a bank building",
  ],
  ticket: [
    "buying a ticket online",
    "digital ticket payment",
  ],
  online: [
    "using a laptop for online payment",
    "online checkout on a computer",
  ],
  spring: [
    "family trip in spring",
    "people traveling during spring",
  ],
};

const CONTEXT_SCENE_HINTS: Record<string, string[]> = {
  password: ["laptop", "computer", "login", "security", "account", "keyboard", "screen"],
  salt: ["salt", "table", "dinner", "meal", "food", "kitchen"],
  umbrella: ["umbrella", "rain", "rainy", "sharing", "outside", "friend", "friends"],
  bus: ["bus", "street", "road", "boarding", "city", "stop"],
  bank: ["bank", "building", "street", "bus"],
  ticket: ["ticket", "payment", "online", "checkout", "purchase"],
  online: ["online", "laptop", "computer", "checkout", "payment", "screen"],
  spring: ["spring", "travel", "trip", "family", "outdoor"],
};

const CONTEXT_NEGATIVE_HINTS: Record<string, string[]> = {
  password: ["storefront", "quote", "window", "poster", "sign", "furniture", "decorations"],
  umbrella: ["skyline", "architecture", "cityscape", "aerial"],
  bus: ["baseball", "stadium", "field"],
  ticket: ["logo", "poster", "mockup"],
};

const tokenizeEnglish = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/g)
    .filter((token) => token.length > 1 && !ENGLISH_STOPWORDS.has(token));

const singularizeToken = (token: string) => {
  if (token.endsWith("ies") && token.length > 3) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("es") && token.length > 3) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
};

const resolveActionKey = (targetWord: string, english?: string) => {
  const targetTokens = tokenizeEnglish(targetWord);
  const englishTokens = tokenizeEnglish(english ?? "");
  const combined = [...targetTokens, ...englishTokens];

  for (const token of combined) {
    const singular = singularizeToken(token);
    if (ACTION_IMAGE_QUERY_HINTS[singular]) {
      return singular;
    }
    if (ACTION_IMAGE_QUERY_HINTS[token]) {
      return token;
    }
  }

  return "";
};

const resolveContextKeys = (english?: string, wordMeaning?: string) => {
  const englishTokens = tokenizeEnglish(english ?? "");
  const meaningTokens = tokenizeEnglish(wordMeaning ?? "");
  const combined = [...englishTokens, ...meaningTokens];

  return Array.from(
    new Set(
      combined
        .map((token) => singularizeToken(token))
        .filter((token) => !!CONTEXT_IMAGE_QUERY_HINTS[token] || !!CONTEXT_SCENE_HINTS[token]),
    ),
  );
};

const buildSentenceSceneQueries = (targetWord: string, english?: string, wordMeaning?: string) => {
  const contextTokens = tokenizeEnglish(english ?? "").slice(0, 6);
  const compactMeaning = tokenizeEnglish(wordMeaning ?? "").slice(0, 2).join(" ");
  const actionKey = resolveActionKey(targetWord, english);
  const contextKeys = resolveContextKeys(english, wordMeaning);
  const sceneTail = contextTokens.join(" ");

  return [
    sceneTail ? `${sceneTail} realistic photo` : "",
    sceneTail ? `${targetWord} scene ${sceneTail}` : "",
    sceneTail && compactMeaning ? `${sceneTail} ${compactMeaning} photo` : "",
    ...(ACTION_IMAGE_QUERY_HINTS[actionKey] ?? []),
    ...contextKeys.flatMap((key) => CONTEXT_IMAGE_QUERY_HINTS[key] ?? []),
  ];
};

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
        ...(ABSTRACT_IMAGE_QUERY_HINTS[normalizedTarget.toLowerCase()] ?? []),
        ...buildSentenceSceneQueries(normalizedTarget, normalizedEnglish, compactMeaning),
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

const buildImageQueriesFromScenePlan = (
  scenePlan: ImageHintScenePlan | null,
  targetWord: string,
  english?: string,
  wordMeaning?: string,
) => {
  const fallbackQueries = buildImageQueries(targetWord, english, wordMeaning);
  if (!scenePlan) {
    return fallbackQueries;
  }

  return Array.from(
    new Set(
      [
        ...scenePlan.searchPhrases,
        scenePlan.senseSummary ? `${scenePlan.senseSummary} realistic photo` : "",
        scenePlan.sceneSummary ? `${scenePlan.sceneSummary} realistic photo` : "",
        ...fallbackQueries,
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

const listPexelsCandidatesSafely = async (
  queries: string[],
  apiKey: string,
) => {
  const deduplicated = new Map<number | string, PexelsPhoto>();
  let hadSuccessfulFetch = false;
  let lastErrorMessage = "";

  for (const queryText of queries) {
    try {
      const photos = await fetchPexelsCandidates(queryText, apiKey);
      hadSuccessfulFetch = true;

      for (const photo of photos) {
        const dedupeKey = photo.id ?? `${photo.url ?? ""}:${photo.src?.medium ?? ""}`;
        if (!dedupeKey) {
          continue;
        }
        if (!deduplicated.has(dedupeKey)) {
          deduplicated.set(dedupeKey, photo);
        }
      }
    } catch (error) {
      lastErrorMessage = error instanceof Error ? error.message : String(error);
      console.warn("fetchPexelsCandidates failed:", queryText, error);
    }
  }

  return {
    photos: Array.from(deduplicated.values()),
    hadSuccessfulFetch,
    lastErrorMessage,
  };
};

const includesAnyTerm = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const isRejectedImageCandidate = (photo: PexelsPhoto) => {
  const value = [photo.alt, photo.url, photo.src?.original, photo.src?.large2x, photo.src?.large]
    .filter((item): item is string => typeof item === "string")
    .join(" ")
    .toLowerCase();

  return includesAnyTerm(value, TEXT_HEAVY_HINTS);
};

const scorePexelsPhoto = (
  photo: PexelsPhoto,
  targetWord: string,
  english: string,
  wordMeaning: string,
  scenePlan?: ImageHintScenePlan | null,
) => {
  const alt = (photo.alt ?? "").toLowerCase().trim();
  const normalizedTarget = targetWord.toLowerCase().trim();
  const actionKey = resolveActionKey(targetWord, english);
  const contextKeys = resolveContextKeys(english, wordMeaning);
  const senseTerms = tokenizeEnglish(scenePlan?.senseSummary ?? "").slice(0, 8);
  const sceneTerms = tokenizeEnglish(scenePlan?.sceneSummary ?? "").slice(0, 8);
  const targetTokens = tokenizeEnglish(targetWord);
  const contextTokens = tokenizeEnglish(english).filter((token) => !targetTokens.includes(token)).slice(0, 5);
  const meaningTokens = wordMeaning
    .toLowerCase()
    .split(/[,\s/]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 2);
  const actionSceneTerms = ACTION_SCENE_HINTS[actionKey] ?? [];
  const actionInteractionTerms = ACTION_INTERACTION_HINTS[actionKey] ?? [];
  const actionNegativeTerms = ACTION_NEGATIVE_HINTS[actionKey] ?? [];
  const contextSceneTerms = contextKeys.flatMap((key) => CONTEXT_SCENE_HINTS[key] ?? []);
  const contextNegativeTerms = contextKeys.flatMap((key) => CONTEXT_NEGATIVE_HINTS[key] ?? []);
  const avoidTerms = scenePlan?.avoidTerms ?? [];

  let score = 0;
  const reasons: string[] = [];
  let positiveSignalCount = 0;

  if (!alt) {
    score -= 5;
    reasons.push("missing-alt");
  } else {
    if (alt.includes(normalizedTarget)) {
      score += actionKey ? 18 : 30;
      reasons.push("exact-target");
    }

    const matchedTargetTokens = targetTokens.filter((token) => alt.includes(token)).length;
    score += matchedTargetTokens * 10;
    if (matchedTargetTokens > 0) {
      reasons.push("target-token");
      positiveSignalCount += matchedTargetTokens;
    }

    const matchedContextTokens = contextTokens.filter((token) => alt.includes(token)).length;
    score += matchedContextTokens * 4;
    if (matchedContextTokens > 0) {
      reasons.push("context-token");
      positiveSignalCount += matchedContextTokens;
    }

    const matchedMeaningTokens = meaningTokens.filter((token) => alt.includes(token)).length;
    score += matchedMeaningTokens * 6;
    if (matchedMeaningTokens > 0) {
      reasons.push("meaning-token");
      positiveSignalCount += matchedMeaningTokens;
    }

    if (isRejectedImageCandidate(photo)) {
      score -= 80;
      reasons.push("text-heavy");
    }

    const matchedPositiveHints = POSITIVE_PHOTO_HINTS.filter((token) => alt.includes(token)).length;
    score += matchedPositiveHints * 3;
    if (matchedPositiveHints > 0) {
      reasons.push("photo-like");
      positiveSignalCount += matchedPositiveHints;
    }

    const matchedSceneHints = actionSceneTerms.filter((token) => alt.includes(token)).length;
    score += matchedSceneHints * 6;
    if (matchedSceneHints > 0) {
      reasons.push("action-scene");
      positiveSignalCount += matchedSceneHints;
    }

    const matchedInteractionHints = actionInteractionTerms.filter((token) => alt.includes(token)).length;
    score += matchedInteractionHints * 10;
    if (matchedInteractionHints > 0) {
      reasons.push("interaction");
      positiveSignalCount += matchedInteractionHints;
    }

    const matchedNegativeHints = actionNegativeTerms.filter((token) => alt.includes(token)).length;
    score -= matchedNegativeHints * 20;
    if (matchedNegativeHints > 0) {
      reasons.push("wrong-sense");
    }

    const matchedContextHints = contextSceneTerms.filter((token) => alt.includes(token)).length;
    score += matchedContextHints * 7;
    if (matchedContextHints > 0) {
      reasons.push("context-scene");
      positiveSignalCount += matchedContextHints;
    }

    const matchedContextNegativeHints = contextNegativeTerms.filter((token) => alt.includes(token)).length;
    score -= matchedContextNegativeHints * 18;
    if (matchedContextNegativeHints > 0) {
      reasons.push("context-wrong-sense");
    }

    const matchedSceneTerms = sceneTerms.filter((token) => alt.includes(token)).length;
    score += matchedSceneTerms * 6;
    if (matchedSceneTerms > 0) {
      reasons.push("scene-summary");
      positiveSignalCount += matchedSceneTerms;
    }

    const matchedSenseTerms = senseTerms.filter((token) => alt.includes(token)).length;
    score += matchedSenseTerms * 8;
    if (matchedSenseTerms > 0) {
      reasons.push("sense-summary");
      positiveSignalCount += matchedSenseTerms;
    }

    const matchedAvoidTerms = avoidTerms.filter((term) => alt.includes(term)).length;
    score -= matchedAvoidTerms * 22;
    if (matchedAvoidTerms > 0) {
      reasons.push("scene-avoid");
    }

    if (scenePlan && positiveSignalCount === 0) {
      score -= 60;
      reasons.push("scene-mismatch");
    }

    if (scenePlan && matchedNegativeHints + matchedContextNegativeHints + matchedAvoidTerms > 0 && positiveSignalCount < 3) {
      score -= 40;
      reasons.push("negative-dominant");
    }

    if ((actionKey === "lend" || actionKey === "lent") && matchedInteractionHints === 0) {
      score -= 45;
      reasons.push("missing-lend-interaction");
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

const buildImageHintScenePlan = async (
  request: ImageHintRequest,
): Promise<ImageHintScenePlan | null> => {
  const apiKey = groqApiKey.value();
  if (!apiKey || !request.english || !request.targetWord) {
    return null;
  }

  try {
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
      max_completion_tokens: 220,
      messages: [
        { role: "system", content: IMAGE_HINT_SCENE_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildImageHintScenePrompt(request),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    return parseImageHintScenePlan(content);
  } catch (error) {
    console.error("buildImageHintScenePlan failed:", error);
    return null;
  }
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
    secrets: [pexelsApiKey, groqApiKey],
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
      const queryWord = typeof data.queryWord === "string" ? normalize(data.queryWord) : "";
      const english = typeof data.english === "string" ? normalize(data.english) : "";
      const wordMeaning = typeof data.wordMeaning === "string" ? normalize(data.wordMeaning) : "";
      const key = pexelsApiKey.value();
      const imageSearchWord = queryWord || targetWord;

      if (!targetWord) {
        response.status(400).set(corsHeaders).json({ error: "targetWord is required." });
        return;
      }

      if (!key) {
        response.status(500).set(corsHeaders).json({ error: "PEXELS_API_KEY is not configured." });
        return;
      }

      const scenePlan = await buildImageHintScenePlan({
        targetWord,
        queryWord: imageSearchWord,
        english,
        wordMeaning,
      });
      const queries = buildImageQueriesFromScenePlan(scenePlan, imageSearchWord, english, wordMeaning);
      const pexelsResult = await listPexelsCandidatesSafely(queries, key);

      const ranked = pexelsResult.photos
        .filter((photo) => !isRejectedImageCandidate(photo))
        .map((photo) => {
          const scored = scorePexelsPhoto(photo, imageSearchWord, english, wordMeaning, scenePlan);
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

      const minimumScore = scenePlan ? 20 : 12;
      if (best && best.score >= minimumScore && bestImageUrl && bestDescriptionUrl) {
        response.status(200).set(corsHeaders).json({
          imageUrl: bestImageUrl,
          descriptionUrl: bestDescriptionUrl,
          title: best.photo.alt?.trim() || imageSearchWord,
          scenePlan: scenePlan ?? undefined,
        } satisfies ImageHintResponse);
        return;
      }

      response.status(404).set(corsHeaders).json({
        error: "No image found.",
        detail: pexelsResult.hadSuccessfulFetch ? undefined : pexelsResult.lastErrorMessage || undefined,
        scenePlan: scenePlan ?? undefined,
      });
    } catch (error) {
      console.error("imageHintSearchHttp failed:", error);
      response.status(404).json({ error: "No image found." });
    }
  },
);

export const setAdminClaimHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const data = request.body as Partial<SetAdminClaimRequest>;
      const targetUid = typeof data.targetUid === "string" ? data.targetUid.trim() : "";
      const shouldBeAdmin = data.admin === true;

      if (!targetUid) {
        response.status(400).set(corsHeaders).json({ error: "targetUid is required." });
        return;
      }

      const targetUser = await getAuth().getUser(targetUid);
      await getAuth().setCustomUserClaims(targetUid, {
        ...targetUser.customClaims,
        admin: shouldBeAdmin,
      });
      await writeAdminLog(decodedToken.uid, shouldBeAdmin ? "grant_admin" : "revoke_admin", "user", targetUid, {
        previousAdmin: targetUser.customClaims?.admin === true,
        nextAdmin: shouldBeAdmin,
      });

      response.status(200).set(corsHeaders).json({
        ok: true,
        targetUid,
        admin: shouldBeAdmin,
      });
    } catch (error) {
      console.error("setAdminClaimHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin claim update failed." });
    }
  },
);

export const adminDeleteCommunityPostHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const data = request.body as Partial<AdminDeleteCommunityPostRequest>;
      const postId = typeof data.postId === "string" ? data.postId.trim() : "";
      if (!postId) {
        response.status(400).set(corsHeaders).json({ error: "postId is required." });
        return;
      }

      await deleteCommunityPostAsAdmin(postId);
      await writeAdminLog(decodedToken.uid, "delete_post", "post", postId);

      response.status(200).set(corsHeaders).json({
        ok: true,
        postId,
      });
    } catch (error) {
      console.error("adminDeleteCommunityPostHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin post delete failed." });
    }
  },
);

export const adminUpsertWordHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const data = request.body as Partial<AdminUpsertWordRequest>;
      const word = typeof data.word === "string" ? data.word.trim() : "";
      const meaning = typeof data.meaning === "string" ? data.meaning.trim() : "";
      const level = typeof data.level === "string" ? data.level.trim() : "";
      const mastery = typeof data.mastery === "number" && Number.isFinite(data.mastery) ? data.mastery : 0;
      const wordId = typeof data.wordId === "string" && data.wordId.trim() ? data.wordId.trim() : "";

      if (!word || !meaning || !level) {
        response.status(400).set(corsHeaders).json({ error: "word, meaning, and level are required." });
        return;
      }

      const wordRef = wordId ? firestore.doc(`words/${wordId}`) : firestore.collection("words").doc();
      const snapshot = await wordRef.get();
      await wordRef.set(
        {
          word,
          meaning,
          level,
          mastery: Math.max(0, Math.min(100, mastery)),
          updatedAt: FieldValue.serverTimestamp(),
          ...(snapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );

      await writeAdminLog(decodedToken.uid, snapshot.exists ? "update_word" : "create_word", "word", wordRef.id, {
        word,
        level,
      });

      response.status(200).set(corsHeaders).json({
        ok: true,
        wordId: wordRef.id,
      });
    } catch (error) {
      console.error("adminUpsertWordHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin word upsert failed." });
    }
  },
);

export const adminDeleteWordHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const data = request.body as Partial<AdminDeleteWordRequest>;
      const wordId = typeof data.wordId === "string" ? data.wordId.trim() : "";
      if (!wordId) {
        response.status(400).set(corsHeaders).json({ error: "wordId is required." });
        return;
      }

      await firestore.doc(`words/${wordId}`).delete();
      await writeAdminLog(decodedToken.uid, "delete_word", "word", wordId);

      response.status(200).set(corsHeaders).json({
        ok: true,
        wordId,
      });
    } catch (error) {
      console.error("adminDeleteWordHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin word delete failed." });
    }
  },
);

export const adminDeleteCommunityCommentHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const data = request.body as Partial<AdminDeleteCommunityCommentRequest>;
      const postId = typeof data.postId === "string" ? data.postId.trim() : "";
      const commentId = typeof data.commentId === "string" ? data.commentId.trim() : "";
      if (!postId || !commentId) {
        response.status(400).set(corsHeaders).json({ error: "postId and commentId are required." });
        return;
      }

      await firestore.doc(`posts/${postId}/comments/${commentId}`).delete();
      await writeAdminLog(decodedToken.uid, "delete_comment", "comment", commentId, { postId });

      response.status(200).set(corsHeaders).json({
        ok: true,
        postId,
        commentId,
      });
    } catch (error) {
      console.error("adminDeleteCommunityCommentHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin comment delete failed." });
    }
  },
);

export const adminListUsersHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const result = await getAuth().listUsers(50);
      response.status(200).set(corsHeaders).json({
        ok: true,
        users: result.users.map((item) => ({
          uid: item.uid,
          displayName: item.displayName ?? "",
          email: item.email ?? "",
          providerId: item.providerData[0]?.providerId ?? (item.providerData.length > 0 ? "unknown" : "anonymous"),
          disabled: item.disabled,
          admin: item.customClaims?.admin === true,
          creationTime: item.metadata.creationTime,
          lastSignInTime: item.metadata.lastSignInTime,
        })),
      });
    } catch (error) {
      console.error("adminListUsersHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin user list failed." });
    }
  },
);

export const adminResetUserStudyDataHttp = onRequest(
  {
    region: "asia-northeast3",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: true,
  },
  async (request, response): Promise<void> => {
    const origin = request.headers.origin;
    const corsHeaders = createCorsHeaders(origin);

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

      const decodedToken = await verifyBearerToken(request.headers.authorization);
      if (!decodedToken) {
        response.status(401).set(corsHeaders).json({ error: "Authentication is required." });
        return;
      }

      if (!hasAdminAccess(decodedToken)) {
        response.status(403).set(corsHeaders).json({ error: "Admin access is required." });
        return;
      }

      const data = request.body as Partial<AdminResetUserDataRequest>;
      const uid = typeof data.uid === "string" ? data.uid.trim() : "";
      if (!uid) {
        response.status(400).set(corsHeaders).json({ error: "uid is required." });
        return;
      }

      const [wordProgresses, favoriteWords, legacyFavorites, postBookmarks] = await Promise.all([
        deleteCollectionDocuments(`users/${uid}/wordProgresses`),
        deleteCollectionDocuments(`users/${uid}/favoriteWords`),
        deleteCollectionDocuments(`users/${uid}/favorites_words`),
        deleteCollectionDocuments(`users/${uid}/postBookmarks`),
      ]);

      await writeAdminLog(decodedToken.uid, "reset_user_study_data", "user", uid, {
        wordProgresses,
        favoriteWords,
        legacyFavorites,
        postBookmarks,
      });

      response.status(200).set(corsHeaders).json({
        ok: true,
        uid,
        deleted: {
          wordProgresses,
          favoriteWords,
          legacyFavorites,
          postBookmarks,
        },
      });
    } catch (error) {
      console.error("adminResetUserStudyDataHttp failed:", error);
      response.status(500).set(corsHeaders).json({ error: "Admin user reset failed." });
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
