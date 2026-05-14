export type GradeWordAnswerRequest = {
  english: string;
  korean: string;
  targetWord: string;
  wordMeaning: string;
  acceptableAnswers: string[];
  correctAnswer: string;
  userAnswer: string;
};

export type GradeWordAnswerResponse = {
  isCorrect: boolean;
  verdict: "correct" | "correct_but_unnatural" | "close" | "incorrect" | "empty";
  message: string;
  hint?: string;
  matchedAnswer?: string;
};

export const SYSTEM_PROMPT = [
  "You are a highly lenient and flexible Korean vocabulary grading assistant.",
  "Judge the user's Korean answer for the highlighted English target word using the full English sentence, full Korean sentence, target word, and meaning.",
  "CRITICAL INSTRUCTION: You must evaluate the CORE MEANING, not the exact wording.",
  "Be generous. Mark isCorrect=true and verdict='correct' when the user's answer has substantially the same meaning as the expected Korean expression in the sentence, even if wording, spacing, nuance, register, particle choice, minor typo, or awkward expression differs.",
  "Differences in tense, verb endings, politeness levels, or nuanced expressions MUST be completely ignored if they convey the same fundamental meaning.",
  "For example, treat '~할 것이다', '~할 예정이다', '~하려고 한다', '~할게', and '~할거야' as perfectly equivalent.",
  "Treat variations like '먹었다', '먹은 상태다', and '먹어버렸다' as completely equivalent when they preserve the sentence meaning.",
  "Treat Korean typos, spacing mistakes, particle mistakes, ending differences, archaic wording, unusual wording, and understandable malformed expressions as correct when a Korean speaker can still understand the intended meaning.",
  "Consider Korean cultural and linguistic context. If the user's interpretation would normally be understood as close enough in Korean usage, accept it.",
  "Prefer semantic understanding over literal surface matching.",
  "Treat synonyms, near-synonyms, polite/casual ending differences, particles, archaic wording, and small wording differences as correct when the sentence meaning is preserved.",
  "Treat contextual synonyms as perfectly correct if they make natural sense in the Korean sentence.",
  "Treat natural Korean paraphrases as correct when they preserve the sentence-level meaning, even if they are not dictionary-like translations.",
  "Accept sentence-form rewrites, softer or stronger endings, and natural Korean rephrasings when the highlighted word plays the same role in context.",
  "If the expected answer is phrase-like but the user gives a natural sentence expression with the same intent, prefer correct over close.",
  "If the user's answer is slightly broader or slightly less literal but still clearly points to the same intended action or meaning in context, accept it.",
  "Do NOT use verdict='correct_but_unnatural' or verdict='close' just because a different ending, particle, tense, politeness level, or synonym was used.",
  "Use verdict='correct_but_unnatural' when the meaning is correct but the wording is noticeably less natural than the common answer.",
  "Use verdict='close' ONLY when the core meaning is partially missing or skewed.",
  "Use verdict='incorrect' ONLY when the meaning is entirely wrong in the sentence.",
  "Use verdict='empty' only when the user answer is blank.",
  "Return only one verdict token: correct, correct_but_unnatural, close, incorrect, or empty.",
].join(" ");

export const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

const normalizeAnswerForComparison = (value: string) =>
  normalize(value)
    .replace(/[.,!?'"`~]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

const semanticEquivalenceGroups = [
  ["줄여야한다", "줄이다", "줄여", "줄이고", "감소시켜야한다", "감소해야한다", "감소시키다", "감소시켜", "감소하고"],
  ["장점", "이점", "이로운점", "메리트", "좋은점", "강점"],
  ["감정", "마음", "심경", "기분"],
  ["씻어", "씻어라", "씻으세요", "씻다", "닦아", "닦아라", "깨끗하게해", "깨끗이해"],
  ["나타났다", "나타나", "왔다", "와", "도착했다", "도착해", "출현했다", "모습을드러냈다"],
  ["예상한다", "예상된다", "전망한다", "전망된다", "기대한다", "본다", "보인다", "내다본다"],
  ["계획하고있다", "계획중이다", "계획중", "계획하고있어", "준비하고있다", "준비하고있어", "준비중이다", "준비중"],
  ["일어났니", "일어났나", "일어났어", "일어났다", "발생했니", "발생했나", "발생했어", "발생했다", "있었니", "있었나", "있었어", "있었다"],
  ["버리지마", "버리지말아라", "버리면안돼", "버리면안된다", "버려서는안돼", "버려서는안된다", "폐기하지마", "폐기하면안돼"],
] as const;

const buildSemanticVariants = (value: string) => {
  const variants = new Set([value]);

  for (const group of semanticEquivalenceGroups) {
    const sources = [...group].sort((left, right) => right.length - left.length);
    for (const source of sources) {
      if (!value.includes(source)) {
        continue;
      }

      for (const replacement of group) {
        variants.add(value.replaceAll(source, replacement));
      }
      break;
    }
  }

  return Array.from(variants);
};

const stripKoreanSuffixes = (value: string) => {
  const suffixes = [
    "할것이다",
    "할예정이다",
    "하려고한다",
    "할거야",
    "할거다",
    "할게",
    "것이다",
    "예정이다",
    "해라",
    "하라",
    "어라",
    "아라",
    "라",
    "습니다",
    "는다",
    "입니다",
    "이에요",
    "예요",
    "이야",
    "야",
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
  return Array.from(
    new Set(
      [normalized, stripped]
        .filter(Boolean)
        .flatMap((variant) => buildSemanticVariants(variant)),
    ),
  );
};

export const findAcceptableMatch = (userAnswer: string, acceptableAnswers: string[]) => {
  const userVariants = buildComparisonVariants(userAnswer);
  return acceptableAnswers.find((answer) => {
    const answerVariants = buildComparisonVariants(answer);
    return userVariants.some((userVariant) => answerVariants.includes(userVariant));
  });
};

export const buildUserPrompt = (request: GradeWordAnswerRequest) =>
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
    "empty",
    "CRITICAL: If the user's answer has the same core meaning, you MUST return 'correct'.",
    "If the user's answer means almost the same thing in this sentence, prefer correct over close.",
    "If the user's answer means the same thing in this sentence, accept it as correct even if it is not listed in reference acceptable answers.",
    "Minor Korean typos, spacing errors, awkward particles, and understandable malformed expressions should usually still be accepted.",
    "Natural Korean sentence rewrites should also be accepted when the sentence meaning is preserved.",
    "Do not penalize for natural Korean variations, verb ending differences, tense differences, politeness differences, particles, or slight nuance differences.",
    "Accept broad contextual synonyms as correct if they fit the sentence naturally.",
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

export const buildFallbackFeedback = (
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
      matchedAnswer: correctAnswer,
    };
  }

  if (similarity >= 0.72) {
    return {
      isCorrect: true,
      verdict: "correct_but_unnatural",
      message: "의미는 맞습니다.",
      hint: `더 자연스러운 표현은 '${correctAnswer}'입니다.`,
      matchedAnswer: correctAnswer,
    };
  }

  return {
    isCorrect: false,
    verdict: "incorrect",
    message: "틀렸습니다. 다시 생각해보세요.",
    hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
  };
};

export const buildFeedbackFromVerdict = (
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
    default:
      return {
        isCorrect: false,
        verdict: "incorrect",
        message: "틀렸습니다. 다시 생각해보세요.",
        hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
      };
  }
};

export const extractVerdict = (value: string): GradeWordAnswerResponse["verdict"] => {
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

export const normalizeRequest = (data: Partial<GradeWordAnswerRequest>) => {
  const english = typeof data.english === "string" ? normalize(data.english) : "";
  const korean = typeof data.korean === "string" ? normalize(data.korean) : "";
  const targetWord = typeof data.targetWord === "string" ? normalize(data.targetWord) : "";
  const wordMeaning = typeof data.wordMeaning === "string" ? normalize(data.wordMeaning) : "";
  const correctAnswer = typeof data.correctAnswer === "string" ? normalize(data.correctAnswer) : "";
  const userAnswer = typeof data.userAnswer === "string" ? normalize(data.userAnswer) : "";
  const acceptableAnswers = Array.isArray(data.acceptableAnswers)
    ? data.acceptableAnswers
        .filter((answer): answer is string => typeof answer === "string")
        .map(normalize)
        .filter(Boolean)
    : [];

  return {
    english,
    korean,
    targetWord,
    wordMeaning,
    correctAnswer,
    userAnswer,
    acceptableAnswers,
  };
};
