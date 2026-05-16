import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { buildWordLookup, listWordLibraryItems, type WordLibraryItem } from "./wordLibrary";

export interface FavoriteWordItem extends WordLibraryItem {
  addedAt: Date | null;
}

export interface FavoriteWordInput {
  id: string;
  word: string;
  meaning: string;
  level: string;
  mastery?: number;
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

function favoriteWordRef(uid: string, wordId: string) {
  return doc(db, "users", uid, "favoriteWords", wordId);
}

function legacyFavoriteWordsRef(uid: string) {
  return collection(db, "users", uid, "favorites_words");
}

function toFavoriteWordItem(id: string, data: DocumentData | undefined, fallback?: WordLibraryItem | null): FavoriteWordItem {
  return {
    id,
    word: typeof data?.word === "string" && data.word.trim() ? data.word.trim() : fallback?.word ?? id,
    meaning:
      typeof data?.meaning === "string" && data.meaning.trim()
        ? data.meaning.trim()
        : fallback?.meaning ?? "뜻 정보가 준비되지 않았습니다.",
    level:
      typeof data?.level === "string" && data.level.trim()
        ? data.level.trim()
        : fallback?.level ?? "전체",
    mastery: typeof data?.mastery === "number" ? data.mastery : fallback?.mastery ?? 0,
    addedAt: asDate(data?.createdAt ?? data?.addedAt),
  };
}

export async function isFavoriteWord(uid: string, wordId: string) {
  const snapshot = await getDoc(favoriteWordRef(uid, wordId));
  if (snapshot.exists()) {
    return true;
  }

  const legacySnapshot = await getDoc(doc(db, "users", uid, "favorites_words", wordId));
  return legacySnapshot.exists();
}

export async function addFavoriteWord(uid: string, word: FavoriteWordInput) {
  await setDoc(
    favoriteWordRef(uid, word.id),
    {
      wordId: word.id,
      word: word.word,
      meaning: word.meaning,
      level: word.level,
      mastery: word.mastery ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function removeFavoriteWord(uid: string, wordId: string) {
  await deleteDoc(favoriteWordRef(uid, wordId));
}

export async function toggleFavoriteWord(uid: string, word: FavoriteWordInput, shouldFavorite: boolean) {
  if (shouldFavorite) {
    await addFavoriteWord(uid, word);
    return true;
  }

  await removeFavoriteWord(uid, word.id);
  return false;
}

export async function listFavoriteWords(uid: string): Promise<FavoriteWordItem[]> {
  const [wordLibrary, favoriteSnapshot, legacySnapshot] = await Promise.all([
    listWordLibraryItems(),
    getDocs(collection(db, "users", uid, "favoriteWords")),
    getDocs(legacyFavoriteWordsRef(uid)).catch(() => null),
  ]);
  const lookup = buildWordLookup(wordLibrary);
  const merged = new Map<string, FavoriteWordItem>();

  for (const item of favoriteSnapshot.docs) {
    const data = item.data();
    const wordId = typeof data.wordId === "string" ? data.wordId : item.id;
    merged.set(wordId, toFavoriteWordItem(wordId, data, lookup.find(wordId)));
  }

  for (const item of legacySnapshot?.docs ?? []) {
    const data = item.data();
    const wordId = typeof data.wordId === "string" ? data.wordId : item.id;
    if (!merged.has(wordId)) {
      merged.set(wordId, toFavoriteWordItem(wordId, data, lookup.find(wordId)));
    }
  }

  return Array.from(merged.values()).sort((left, right) => {
    const leftTime = left.addedAt?.getTime() ?? 0;
    const rightTime = right.addedAt?.getTime() ?? 0;
    return rightTime - leftTime;
  });
}
