import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QuerySnapshot,
  type Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";

import { db } from "./firebase";
import { isLocalTestMode } from "./localTestMode";

const USER_PROFILES_STORAGE_KEY = "wordy.user-profiles";
const USER_PROFILES_EVENT = "wordy:user-profiles-changed";
const LOCAL_ADMIN_EMAILS = ["hsmocap@gmail.com", "wns544@naver.com"];

export interface UserProfileSummary {
  uid: string;
  email: string;
  displayName: string;
  providerId: string;
  isAdmin: boolean;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
}

function isAdminEmail(email: string) {
  return LOCAL_ADMIN_EMAILS.includes(email.trim().toLowerCase());
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

function toUserProfileSummary(snapshot: QuerySnapshot<DocumentData>["docs"][number]): UserProfileSummary {
  const data = snapshot.data();
  return {
    uid: snapshot.id,
    email: typeof data.email === "string" ? data.email : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "익명 사용자",
    providerId: typeof data.providerId === "string" ? data.providerId : "unknown",
    isAdmin: Boolean(data.isAdmin),
    createdAt: asDate(data.createdAt),
    lastLoginAt: asDate(data.lastLoginAt),
    lastSeenAt: asDate(data.lastSeenAt),
  };
}

function readLocalUserProfiles() {
  if (typeof window === "undefined") {
    return [] as UserProfileSummary[];
  }

  try {
    const raw = window.localStorage.getItem(USER_PROFILES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((item) => ({
      uid: typeof item.uid === "string" ? item.uid : "",
      email: typeof item.email === "string" ? item.email : "",
      displayName: typeof item.displayName === "string" ? item.displayName : "익명 사용자",
      providerId: typeof item.providerId === "string" ? item.providerId : "unknown",
      isAdmin: Boolean(item.isAdmin),
      createdAt: asDate(item.createdAt as string | null | undefined),
      lastLoginAt: asDate(item.lastLoginAt as string | null | undefined),
      lastSeenAt: asDate(item.lastSeenAt as string | null | undefined),
    }));
  } catch {
    return [];
  }
}

function writeLocalUserProfiles(items: UserProfileSummary[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    USER_PROFILES_STORAGE_KEY,
    JSON.stringify(
      items.map((item) => ({
        ...item,
        createdAt: item.createdAt?.toISOString() ?? null,
        lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
        lastSeenAt: item.lastSeenAt?.toISOString() ?? null,
      })),
    ),
  );
  window.dispatchEvent(new CustomEvent(USER_PROFILES_EVENT));
}

export async function syncCurrentUserProfile(user: User, displayName: string, options?: { markLogin?: boolean }) {
  const email = user.email ?? "";
  const primaryProvider = user.providerData[0]?.providerId ?? user.providerId ?? "unknown";

  const writeLocalProfile = () => {
    const current = readLocalUserProfiles();
    const existing = current.find((item) => item.uid === user.uid);
    const now = new Date();
    const nextItem: UserProfileSummary = {
      uid: user.uid,
      email,
      displayName,
      providerId: primaryProvider,
      isAdmin: isAdminEmail(email),
      createdAt: existing?.createdAt ?? asDate(user.metadata.creationTime),
      lastLoginAt: options?.markLogin ? now : (existing?.lastLoginAt ?? null),
      lastSeenAt: now,
    };

    writeLocalUserProfiles([nextItem, ...current.filter((item) => item.uid !== user.uid)]);
  };

  if (isLocalTestMode()) {
    writeLocalProfile();
    return;
  }

  try {
    await setDoc(
      doc(db, "userProfiles", user.uid),
      {
        email,
        displayName,
        providerId: primaryProvider,
        isAdmin: isAdminEmail(email),
        createdAt: user.metadata.creationTime ?? null,
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(options?.markLogin ? { lastLoginAt: serverTimestamp() } : {}),
      },
      { merge: true },
    );
  } catch {
    writeLocalProfile();
  }
}

export function subscribeRecentUserProfiles(callback: (items: UserProfileSummary[]) => void) {
  const emitLocal = () => {
    callback(
      readLocalUserProfiles()
        .sort((left, right) => (right.lastSeenAt?.getTime() ?? 0) - (left.lastSeenAt?.getTime() ?? 0))
        .slice(0, 20),
    );
  };

  if (isLocalTestMode()) {
    emitLocal();
    const handleChange = () => emitLocal();
    window.addEventListener(USER_PROFILES_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(USER_PROFILES_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }

  const profilesQuery = query(collection(db, "userProfiles"), orderBy("lastSeenAt", "desc"), limit(20));
  let localFallbackCleanup: (() => void) | null = null;

  const enableLocalFallback = () => {
    if (typeof window === "undefined" || localFallbackCleanup) {
      return;
    }

    emitLocal();
    const handleChange = () => emitLocal();
    window.addEventListener(USER_PROFILES_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    localFallbackCleanup = () => {
      window.removeEventListener(USER_PROFILES_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
      localFallbackCleanup = null;
    };
  };

  const unsubscribe = onSnapshot(
    profilesQuery,
    (snapshot) => {
      callback(snapshot.docs.map(toUserProfileSummary));
    },
    () => enableLocalFallback(),
  );

  return () => {
    unsubscribe();
    localFallbackCleanup?.();
  };
}
