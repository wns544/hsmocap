import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";
import { createLocalId, isLocalTestMode } from "./localTestMode";

const FEEDBACKS_STORAGE_KEY = "wordy.feedbacks";
const FEEDBACKS_EVENT = "wordy:feedbacks-changed";

export type FeedbackStatus = "open" | "reviewing" | "resolved";

export interface FeedbackRecord {
  id: string;
  userId: string;
  authorName: string;
  authorEmail: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
  imageUrls: string[];
  isImportant: boolean;
  status: FeedbackStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateFeedbackInput {
  userId: string;
  authorName: string;
  authorEmail?: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
  isImportant: boolean;
  imageUrls?: string[];
}

function asDate(value: Timestamp | Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  return null;
}

function toFeedbackStatus(value: unknown): FeedbackStatus {
  return value === "reviewing" || value === "resolved" ? value : "open";
}

function toFeedbackRecord(id: string, data: DocumentData): FeedbackRecord {
  const authorSnapshot =
    typeof data.authorSnapshot === "object" && data.authorSnapshot ? data.authorSnapshot : {};

  return {
    id,
    userId: typeof data.userId === "string" ? data.userId : "",
    authorName: typeof authorSnapshot.name === "string" ? authorSnapshot.name : "",
    authorEmail: typeof authorSnapshot.email === "string" ? authorSnapshot.email : "",
    categoryId: typeof data.categoryId === "string" ? data.categoryId : "",
    categoryName: typeof data.categoryName === "string" ? data.categoryName : "",
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    imageUrls: Array.isArray(data.imageUrls)
      ? data.imageUrls.filter((value: unknown): value is string => typeof value === "string" && value.trim() !== "")
      : [],
    isImportant: data.isImportant === true,
    status: toFeedbackStatus(data.status),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

function readLocalFeedbacks() {
  if (typeof window === "undefined") {
    return [] as FeedbackRecord[];
  }

  try {
    const raw = window.localStorage.getItem(FEEDBACKS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      userId: typeof item.userId === "string" ? item.userId : "",
      authorName: typeof item.authorName === "string" ? item.authorName : "익명 사용자",
      authorEmail: typeof item.authorEmail === "string" ? item.authorEmail : "",
      categoryId: typeof item.categoryId === "string" ? item.categoryId : "",
      categoryName: typeof item.categoryName === "string" ? item.categoryName : "",
      title: typeof item.title === "string" ? item.title : "",
      body: typeof item.body === "string" ? item.body : "",
      imageUrls: Array.isArray(item.imageUrls)
        ? item.imageUrls.filter((value): value is string => typeof value === "string")
        : [],
      isImportant: item.isImportant === true,
      status: toFeedbackStatus(item.status),
      createdAt: asDate(item.createdAt as string | null | undefined),
      updatedAt: asDate(item.updatedAt as string | null | undefined),
    }));
  } catch {
    return [];
  }
}

function writeLocalFeedbacks(items: FeedbackRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    FEEDBACKS_STORAGE_KEY,
    JSON.stringify(
      items.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString() ?? null,
        updatedAt: item.updatedAt?.toISOString() ?? null,
      })),
    ),
  );
  window.dispatchEvent(new CustomEvent(FEEDBACKS_EVENT));
}

export async function createFeedback(input: CreateFeedbackInput): Promise<string> {
  const writeLocalFeedback = () => {
    const current = readLocalFeedbacks();
    const now = new Date();
    const id = createLocalId("feedback");

    writeLocalFeedbacks([
      {
        id,
        userId: input.userId,
        authorName: input.authorName,
        authorEmail: input.authorEmail ?? "",
        categoryId: input.categoryId,
        categoryName: input.categoryName,
        title: input.title,
        body: input.body,
        isImportant: input.isImportant,
        imageUrls: input.imageUrls ?? [],
        status: "open",
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ]);

    return id;
  };

  if (isLocalTestMode()) {
    return writeLocalFeedback();
  }

  try {
    const snapshot = await addDoc(collection(db, "feedbacks"), {
      userId: input.userId,
      authorSnapshot: {
        name: input.authorName,
        email: input.authorEmail ?? "",
      },
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      title: input.title,
      body: input.body,
      isImportant: input.isImportant,
      imageUrls: input.imageUrls ?? [],
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return snapshot.id;
  } catch {
    return writeLocalFeedback();
  }
}

export async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void> {
  const writeLocalStatus = () => {
    const current = readLocalFeedbacks();
    const now = new Date();
    writeLocalFeedbacks(
      current.map((item) =>
        item.id === feedbackId
          ? {
              ...item,
              status,
              updatedAt: now,
            }
          : item,
      ),
    );
  };

  if (isLocalTestMode()) {
    writeLocalStatus();
    return;
  }

  try {
    await updateDoc(doc(db, "feedbacks", feedbackId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch {
    writeLocalStatus();
  }
}

export async function listFeedbacksForAdmin(maxItems = 50): Promise<FeedbackRecord[]> {
  if (isLocalTestMode()) {
    return readLocalFeedbacks()
      .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0))
      .slice(0, maxItems);
  }

  try {
    const snapshot = await getDocs(query(collection(db, "feedbacks"), orderBy("createdAt", "desc"), limit(maxItems)));
    return snapshot.docs.map((item) => toFeedbackRecord(item.id, item.data()));
  } catch {
    return readLocalFeedbacks()
      .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0))
      .slice(0, maxItems);
  }
}

export function subscribeUserFeedbacks(userId: string, callback: (items: FeedbackRecord[]) => void) {
  const emitLocal = () => {
    callback(
      readLocalFeedbacks()
        .filter((item) => item.userId === userId)
        .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0)),
    );
  };

  if (isLocalTestMode()) {
    emitLocal();
    const handleChange = () => emitLocal();
    window.addEventListener(FEEDBACKS_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(FEEDBACKS_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }

  const feedbackQuery = query(collection(db, "feedbacks"), where("userId", "==", userId), limit(30));
  let localFallbackCleanup: (() => void) | null = null;

  const enableLocalFallback = () => {
    if (typeof window === "undefined" || localFallbackCleanup) {
      return;
    }

    emitLocal();
    const handleChange = () => emitLocal();
    window.addEventListener(FEEDBACKS_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    localFallbackCleanup = () => {
      window.removeEventListener(FEEDBACKS_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
      localFallbackCleanup = null;
    };
  };

  const unsubscribe = onSnapshot(
    feedbackQuery,
    (snapshot) => {
      callback(
        snapshot.docs
          .map((item) => toFeedbackRecord(item.id, item.data()))
          .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0)),
      );
    },
    () => enableLocalFallback(),
  );

  return () => {
    unsubscribe();
    localFallbackCleanup?.();
  };
}
