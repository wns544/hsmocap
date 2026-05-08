import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

export interface NormalizedQuizWord {
  id: string;
  word: string;
  meaning: string;
  level: string;
  exampleSentence: string;
  exampleTranslation: string;
  quizKoreanBlank: string;
  quizAnswers: string[];
  createdAt: unknown | null;
}

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export const normalizeQuizWordDoc = (
  id: string,
  data: DocumentData | Record<string, unknown>,
): NormalizedQuizWord => ({
  id,
  word: normalizeString(data.word),
  meaning: normalizeString(data.meaning),
  level: normalizeString(data.level),
  exampleSentence: normalizeString(data.exampleSentence),
  exampleTranslation: normalizeString(data.exampleTranslation),
  quizKoreanBlank: normalizeString(data.quizKoreanBlank),
  quizAnswers: normalizeStringArray(data.quizAnswers),
  createdAt: data.createdAt ?? null,
});

export const normalizeQuizWordDocs = (
  docs: QueryDocumentSnapshot<DocumentData>[],
) => docs.map((doc) => normalizeQuizWordDoc(doc.id, doc.data()));

export const isQuizWordUsable = (word: NormalizedQuizWord) =>
  Boolean(
    word.word &&
      word.exampleSentence &&
      word.exampleTranslation &&
      word.quizKoreanBlank &&
      word.quizAnswers.length > 0,
  );

const BLANK_PATTERN = /[_＿□▢○◯…]+/;

export const resolveQuizCorrectAnswer = (word: NormalizedQuizWord) => {
  if (BLANK_PATTERN.test(word.quizKoreanBlank)) {
    return word.quizAnswers[0] ?? "";
  }

  return word.quizKoreanBlank || word.quizAnswers[0] || "";
};
