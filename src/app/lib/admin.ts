import { collection, getDocs, limit, orderBy, query, type DocumentData, type Timestamp } from "firebase/firestore";
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
