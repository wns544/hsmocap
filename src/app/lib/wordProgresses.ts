import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type WordProgressStatus = "NOT_STARTED" | "LEARNING" | "REVIEW" | "MASTERED";
export type WordProgressLastResult = "correct" | "wrong" | null;

export interface WordProgressRecord {
  wordId: string;
  status: WordProgressStatus;
  currentStage: number;
  totalAnswerCount: number;
  correctAnswerCount: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  lastResult: WordProgressLastResult;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UpsertWordProgressInput {
  uid: string;
  wordId: string;
  status?: WordProgressStatus;
  currentStage?: number;
  totalAnswerCount?: number;
  correctAnswerCount?: number;
  lastReviewedAt?: Date | null;
  nextReviewAt?: Date | null;
  lastResult?: WordProgressLastResult;
}

const DEFAULT_WORD_PROGRESS: Omit<WordProgressRecord, "wordId"> = {
  status: "NOT_STARTED",
  currentStage: 0,
  totalAnswerCount: 0,
  correctAnswerCount: 0,
  lastReviewedAt: null,
  nextReviewAt: null,
  lastResult: null,
  createdAt: null,
  updatedAt: null,
};

function asDate(value: Timestamp | Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  return null;
}

function toWordProgressRecord(wordId: string, data?: DocumentData | null): WordProgressRecord {
  if (!data) {
    return {
      wordId,
      ...DEFAULT_WORD_PROGRESS,
    };
  }

  return {
    wordId,
    status:
      data.status === "LEARNING" ||
      data.status === "REVIEW" ||
      data.status === "MASTERED" ||
      data.status === "NOT_STARTED"
        ? data.status
        : "NOT_STARTED",
    currentStage: Number(data.currentStage ?? 0),
    totalAnswerCount: Number(data.totalAnswerCount ?? 0),
    correctAnswerCount: Number(data.correctAnswerCount ?? 0),
    lastReviewedAt: asDate(data.lastReviewedAt),
    nextReviewAt: asDate(data.nextReviewAt),
    lastResult: data.lastResult === "correct" || data.lastResult === "wrong" ? data.lastResult : null,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

function getWordProgressRef(uid: string, wordId: string) {
  return doc(db, "users", uid, "wordProgresses", wordId);
}

function getUserProfileRef(uid: string) {
  return doc(db, "users", uid);
}

async function ensureUserProfileDocument(uid: string) {
  const userRef = getUserProfileRef(uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    await setDoc(
      userRef,
      {
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return;
  }

  await setDoc(
    userRef,
    {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profileSource: "review-flow",
      reviewProfileInitializedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getWordProgress(uid: string, wordId: string): Promise<WordProgressRecord | null> {
  const snapshot = await getDoc(getWordProgressRef(uid, wordId));
  if (!snapshot.exists()) {
    return null;
  }

  return toWordProgressRecord(wordId, snapshot.data());
}

export async function upsertWordProgress(input: UpsertWordProgressInput): Promise<WordProgressRecord> {
  await ensureUserProfileDocument(input.uid);

  const progressRef = getWordProgressRef(input.uid, input.wordId);
  const snapshot = await getDoc(progressRef);
  const existing = toWordProgressRecord(input.wordId, snapshot.exists() ? snapshot.data() : null);

  const nextRecord = {
    wordId: input.wordId,
    status: input.status ?? existing.status,
    currentStage: input.currentStage ?? existing.currentStage,
    totalAnswerCount: input.totalAnswerCount ?? existing.totalAnswerCount,
    correctAnswerCount: input.correctAnswerCount ?? existing.correctAnswerCount,
    lastReviewedAt:
      input.lastReviewedAt === undefined ? existing.lastReviewedAt : input.lastReviewedAt,
    nextReviewAt: input.nextReviewAt === undefined ? existing.nextReviewAt : input.nextReviewAt,
    lastResult: input.lastResult === undefined ? existing.lastResult : input.lastResult,
  };

  await setDoc(
    progressRef,
    {
      ...nextRecord,
      createdAt: snapshot.exists() ? snapshot.data()?.createdAt ?? serverTimestamp() : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    ...nextRecord,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
}

export async function listDueReviewWordIds(uid: string, now = new Date()): Promise<string[]> {
  const snapshot = await getDocs(query(collection(db, "users", uid, "wordProgresses")));

  return snapshot.docs
    .map((item) => toWordProgressRecord(item.id, item.data()))
    .filter((item) => item.status !== "MASTERED")
    .filter((item) => item.nextReviewAt !== null && item.nextReviewAt.getTime() <= now.getTime())
    .map((item) => item.wordId);
}

export async function listWrongOrWeakWordIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(query(collection(db, "users", uid, "wordProgresses")));

  return snapshot.docs
    .map((item) => toWordProgressRecord(item.id, item.data()))
    .filter((item) => item.status !== "MASTERED")
    .filter((item) => {
      if (item.lastResult === "wrong") {
        return true;
      }

      if (item.totalAnswerCount === 0) {
        return false;
      }

      const accuracy = item.correctAnswerCount / item.totalAnswerCount;
      return accuracy < 0.7 || item.currentStage < 2;
    })
    .map((item) => item.wordId);
}

export async function listWordProgresses(uid: string): Promise<WordProgressRecord[]> {
  const snapshot = await getDocs(query(collection(db, "users", uid, "wordProgresses")));

  return snapshot.docs.map((item) => toWordProgressRecord(item.id, item.data()));
}

export async function listReviewQueueWordIds(uid: string, now = new Date()): Promise<string[]> {
  const progresses = await listWordProgresses(uid);

  return progresses
    .filter((item) => item.status !== "MASTERED")
    .filter((item) => {
      if (item.lastResult === "wrong") {
        return true;
      }

      if (item.nextReviewAt && item.nextReviewAt.getTime() <= now.getTime()) {
        return true;
      }

      if (item.totalAnswerCount > 0) {
        const accuracy = item.correctAnswerCount / item.totalAnswerCount;
        return accuracy < 0.7 || item.currentStage < 2;
      }

      return false;
    })
    .map((item) => item.wordId);
}
