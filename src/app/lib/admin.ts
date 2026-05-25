import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const FUNCTIONS_BASE_URL = "https://asia-northeast3-hsmocap-d907e.cloudfunctions.net";

export interface AdminUpsertWordInput {
  wordId?: string;
  word: string;
  meaning: string;
  level: string;
  mastery?: number;
}

export interface AdminLogRecord {
  id: string;
  adminUid: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: Date | null;
}

export interface AdminUserSummary {
  uid: string;
  displayName: string;
  email: string;
  providerId: string;
  disabled: boolean;
  admin: boolean;
  creationTime: string;
  lastSignInTime: string;
}

export type FeedbackStatus = "open" | "reviewing" | "resolved";

export interface AdminFeedbackRecord {
  id: string;
  userId: string;
  authorName: string;
  authorEmail: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
  isImportant: boolean;
  status: FeedbackStatus;
  emailStatus: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

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

async function callAdminFunction<TResponse>(name: string, body: Record<string, unknown>) {
  const token = await auth.currentUser?.getIdToken(true);
  if (!token) {
    throw new Error("Authentication is required.");
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Admin function failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function setAdminClaim(targetUid: string, admin: boolean) {
  return callAdminFunction<{ ok: true; targetUid: string; admin: boolean }>("setAdminClaimHttp", {
    targetUid,
    admin,
  });
}

export async function adminUpsertWord(input: AdminUpsertWordInput) {
  return callAdminFunction<{ ok: true; wordId: string }>("adminUpsertWordHttp", input);
}

export async function adminDeleteWord(wordId: string) {
  return callAdminFunction<{ ok: true; wordId: string }>("adminDeleteWordHttp", { wordId });
}

export async function adminDeleteCommunityPost(postId: string) {
  return callAdminFunction<{ ok: true; postId: string }>("adminDeleteCommunityPostHttp", { postId });
}

export async function adminDeleteCommunityComment(postId: string, commentId: string) {
  return callAdminFunction<{ ok: true; postId: string; commentId: string }>("adminDeleteCommunityCommentHttp", {
    postId,
    commentId,
  });
}

export async function adminListUsers() {
  const response = await callAdminFunction<{ ok: true; users: AdminUserSummary[] }>("adminListUsersHttp", {});
  return response.users;
}

export async function adminResetUserStudyData(uid: string) {
  return callAdminFunction<{ ok: true; uid: string; deleted: Record<string, number> }>("adminResetUserStudyDataHttp", {
    uid,
  });
}

function toFeedbackStatus(value: unknown): FeedbackStatus {
  return value === "reviewing" || value === "resolved" ? value : "open";
}

function toAdminLogRecord(id: string, data: DocumentData): AdminLogRecord {
  return {
    id,
    adminUid: typeof data.adminUid === "string" ? data.adminUid : "",
    action: typeof data.action === "string" ? data.action : "",
    targetType: typeof data.targetType === "string" ? data.targetType : "",
    targetId: typeof data.targetId === "string" ? data.targetId : "",
    details: typeof data.details === "object" && data.details ? data.details : {},
    createdAt: asDate(data.createdAt),
  };
}

export async function listAdminLogs(maxItems = 30): Promise<AdminLogRecord[]> {
  const snapshot = await getDocs(query(collection(db, "adminLogs"), orderBy("createdAt", "desc"), limit(maxItems)));
  return snapshot.docs.map((item) => toAdminLogRecord(item.id, item.data()));
}

function toAdminFeedbackRecord(id: string, data: DocumentData): AdminFeedbackRecord {
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
    isImportant: data.isImportant === true,
    status: toFeedbackStatus(data.status),
    emailStatus: typeof data.emailStatus === "string" ? data.emailStatus : "",
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listAdminFeedbacks(maxItems = 50): Promise<AdminFeedbackRecord[]> {
  const snapshot = await getDocs(query(collection(db, "feedbacks"), orderBy("createdAt", "desc"), limit(maxItems)));
  return snapshot.docs.map((item) => toAdminFeedbackRecord(item.id, item.data()));
}

export async function updateAdminFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void> {
  await updateDoc(doc(db, "feedbacks", feedbackId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
