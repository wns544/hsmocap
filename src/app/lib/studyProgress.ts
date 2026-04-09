import { fallbackWordSummaries } from "./words";

type NormalizedLevel = "초급" | "중급" | "고급" | "비즈니스" | "전체" | "기타";

interface WordProgress {
  key: string;
  word: string;
  level: string;
  normalizedLevel: NormalizedLevel;
  correctCount: number;
  wrongCount: number;
  mastery: number;
  earnedXp: number;
}

interface StudyProgressState {
  totalXp: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  completedSessions: number;
  perfectSessions: number;
  words: Record<string, WordProgress>;
}

interface StudyAnswerPayload {
  wordId?: number | string;
  word: string;
  level?: string;
}

interface SessionPayload {
  correctCount: number;
  wrongCount: number;
}

export interface StudyAchievement {
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface StudyProgressSummary {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  uniqueStudiedWords: number;
  masteredWords: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  completedSessions: number;
  perfectSessions: number;
  accuracyRate: number;
  achievements: StudyAchievement[];
  levelBreakdown: Record<"초급" | "중급" | "고급", { studied: number; total: number; progress: number }>;
}

const STORAGE_KEY = "wordy.studyProgress";
const CHANGE_EVENT = "wordy-study-progress-changed";

const emptyState: StudyProgressState = {
  totalXp: 0,
  totalCorrectAnswers: 0,
  totalWrongAnswers: 0,
  completedSessions: 0,
  perfectSessions: 0,
  words: {},
};

const totalWordsByLevel = fallbackWordSummaries.reduce<Record<"초급" | "중급" | "고급", number>>(
  (acc, word) => {
    const normalized = normalizeLevel(word.level);
    if (normalized === "초급" || normalized === "중급" || normalized === "고급") {
      acc[normalized] += 1;
    }
    return acc;
  },
  { 초급: 0, 중급: 0, 고급: 0 },
);

function emitProgressChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

function loadState(): StudyProgressState {
  if (typeof window === "undefined") {
    return emptyState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StudyProgressState>;
    return {
      totalXp: typeof parsed.totalXp === "number" ? parsed.totalXp : 0,
      totalCorrectAnswers: typeof parsed.totalCorrectAnswers === "number" ? parsed.totalCorrectAnswers : 0,
      totalWrongAnswers: typeof parsed.totalWrongAnswers === "number" ? parsed.totalWrongAnswers : 0,
      completedSessions: typeof parsed.completedSessions === "number" ? parsed.completedSessions : 0,
      perfectSessions: typeof parsed.perfectSessions === "number" ? parsed.perfectSessions : 0,
      words: typeof parsed.words === "object" && parsed.words ? parsed.words : {},
    };
  } catch {
    return emptyState;
  }
}

function saveState(state: StudyProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitProgressChange();
}

export function normalizeLevel(level?: string): NormalizedLevel {
  switch (level) {
    case "초급":
    case "珥덇툒":
      return "초급";
    case "중급":
    case "以묎툒":
      return "중급";
    case "고급":
    case "怨좉툒":
      return "고급";
    case "비즈니스":
    case "鍮꾩쫰?덉뒪":
      return "비즈니스";
    case "전체":
    case "?꾩껜":
      return "전체";
    default:
      return "기타";
  }
}

function getXpReward(level?: string): number {
  switch (normalizeLevel(level)) {
    case "초급":
      return 12;
    case "중급":
      return 18;
    case "고급":
      return 26;
    case "비즈니스":
      return 32;
    default:
      return 15;
  }
}

function getMasteryGain(level?: string): number {
  switch (normalizeLevel(level)) {
    case "초급":
      return 16;
    case "중급":
      return 14;
    case "고급":
      return 12;
    case "비즈니스":
      return 10;
    default:
      return 12;
  }
}

function getWordKey(payload: StudyAnswerPayload): string {
  if (payload.wordId !== undefined) {
    return `id:${String(payload.wordId)}`;
  }

  return `word:${payload.word.trim().toLowerCase()}`;
}

export function getRequiredXpForNextLevel(level: number): number {
  return 120 + (level - 1) * 55 + (level - 1) * (level - 1) * 12;
}

export function getLevelFromXp(totalXp: number) {
  let remainingXp = totalXp;
  let level = 1;

  while (remainingXp >= getRequiredXpForNextLevel(level)) {
    remainingXp -= getRequiredXpForNextLevel(level);
    level += 1;
  }

  return {
    level,
    currentLevelXp: remainingXp,
    nextLevelXp: getRequiredXpForNextLevel(level),
  };
}

export function recordCorrectAnswer(payload: StudyAnswerPayload) {
  const state = loadState();
  const key = getWordKey(payload);
  const current = state.words[key];
  const rewardXp = getXpReward(payload.level);
  const masteryGain = getMasteryGain(payload.level);

  state.words[key] = {
    key,
    word: payload.word,
    level: payload.level || current?.level || "",
    normalizedLevel: normalizeLevel(payload.level || current?.level),
    correctCount: (current?.correctCount || 0) + 1,
    wrongCount: current?.wrongCount || 0,
    mastery: Math.min(100, (current?.mastery || 0) + masteryGain),
    earnedXp: (current?.earnedXp || 0) + rewardXp,
  };

  state.totalXp += rewardXp;
  state.totalCorrectAnswers += 1;
  saveState(state);

  return {
    rewardXp,
    totalXp: state.totalXp,
    ...getLevelFromXp(state.totalXp),
  };
}

export function recordWrongAnswer(payload: StudyAnswerPayload) {
  const state = loadState();
  const key = getWordKey(payload);
  const current = state.words[key];

  state.words[key] = {
    key,
    word: payload.word,
    level: payload.level || current?.level || "",
    normalizedLevel: normalizeLevel(payload.level || current?.level),
    correctCount: current?.correctCount || 0,
    wrongCount: (current?.wrongCount || 0) + 1,
    mastery: current?.mastery || 0,
    earnedXp: current?.earnedXp || 0,
  };

  state.totalWrongAnswers += 1;
  saveState(state);
}

export function recordStudySessionCompletion(payload: SessionPayload) {
  if (payload.correctCount + payload.wrongCount <= 0) {
    return;
  }

  const state = loadState();
  state.completedSessions += 1;
  if (payload.correctCount > 0 && payload.wrongCount === 0) {
    state.perfectSessions += 1;
  }
  saveState(state);
}

function buildAchievements(summary: Omit<StudyProgressSummary, "achievements">): StudyAchievement[] {
  return [
    {
      name: "첫걸음",
      description: "첫 단어를 맞히면 달성",
      icon: "🌱",
      earned: summary.uniqueStudiedWords >= 1,
    },
    {
      name: "연습왕",
      description: "10개 단어를 학습하면 달성",
      icon: "📘",
      earned: summary.uniqueStudiedWords >= 10,
    },
    {
      name: "꾸준함",
      description: "학습 세션 7회를 완료하면 달성",
      icon: "🔥",
      earned: summary.completedSessions >= 7,
    },
    {
      name: "퀴즈 마스터",
      description: "학습 세션 10회를 완료하면 달성",
      icon: "🏆",
      earned: summary.completedSessions >= 10,
    },
    {
      name: "집중력",
      description: "완벽한 학습 세션 5회를 달성",
      icon: "🎯",
      earned: summary.perfectSessions >= 5,
    },
    {
      name: "전문가",
      description: "숙련도 100인 단어 20개 달성",
      icon: "🧠",
      earned: summary.masteredWords >= 20,
    },
  ];
}

export function getStudyProgressSummary(): StudyProgressSummary {
  const state = loadState();
  const levelInfo = getLevelFromXp(state.totalXp);
  const wordEntries = Object.values(state.words);
  const uniqueStudiedWords = wordEntries.filter((word) => word.correctCount > 0).length;
  const masteredWords = wordEntries.filter((word) => word.mastery >= 100).length;
  const totalAnswers = state.totalCorrectAnswers + state.totalWrongAnswers;
  const accuracyRate = totalAnswers > 0 ? Math.round((state.totalCorrectAnswers / totalAnswers) * 100) : 0;

  const levelBreakdown = {
    초급: {
      studied: wordEntries.filter((word) => word.normalizedLevel === "초급" && word.correctCount > 0).length,
      total: totalWordsByLevel.초급,
      progress: 0,
    },
    중급: {
      studied: wordEntries.filter((word) => word.normalizedLevel === "중급" && word.correctCount > 0).length,
      total: totalWordsByLevel.중급,
      progress: 0,
    },
    고급: {
      studied: wordEntries.filter((word) => word.normalizedLevel === "고급" && word.correctCount > 0).length,
      total: totalWordsByLevel.고급,
      progress: 0,
    },
  } satisfies Record<"초급" | "중급" | "고급", { studied: number; total: number; progress: number }>;

  (Object.keys(levelBreakdown) as Array<keyof typeof levelBreakdown>).forEach((key) => {
    const item = levelBreakdown[key];
    item.progress = item.total > 0 ? Math.round((item.studied / item.total) * 100) : 0;
  });

  const baseSummary = {
    totalXp: state.totalXp,
    level: levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    nextLevelXp: levelInfo.nextLevelXp,
    xpToNextLevel: levelInfo.nextLevelXp - levelInfo.currentLevelXp,
    uniqueStudiedWords,
    masteredWords,
    totalCorrectAnswers: state.totalCorrectAnswers,
    totalWrongAnswers: state.totalWrongAnswers,
    completedSessions: state.completedSessions,
    perfectSessions: state.perfectSessions,
    accuracyRate,
    levelBreakdown,
  };

  return {
    ...baseSummary,
    achievements: buildAchievements(baseSummary),
  };
}

export function subscribeStudyProgress(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
