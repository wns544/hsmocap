import { collection, getDocs, orderBy, query, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";
import { fallbackWordSummaries, type WordSummary } from "./words";

export interface WordLibraryItem {
  id: string;
  word: string;
  meaning: string;
  level: string;
  mastery: number;
}

const normalizeString = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

export function normalizeWordLibraryDoc(id: string, data: DocumentData | Record<string, unknown>): WordLibraryItem {
  return {
    id,
    word: normalizeString(data.word, id),
    meaning: normalizeString(data.meaning, "뜻 정보가 준비되지 않았습니다."),
    level: normalizeString(data.level, "전체"),
    mastery: typeof data.mastery === "number" ? data.mastery : 0,
  };
}

export function fallbackWordLibraryItems(): WordLibraryItem[] {
  return fallbackWordSummaries.map((word: WordSummary) => ({
    id: String(word.id),
    word: word.word,
    meaning: word.meaning,
    level: word.level,
    mastery: word.mastery,
  }));
}

export async function listWordLibraryItems(): Promise<WordLibraryItem[]> {
  try {
    const snapshot = await getDocs(query(collection(db, "words"), orderBy("createdAt", "desc")));
    if (!snapshot.empty) {
      return snapshot.docs.map((item) => normalizeWordLibraryDoc(item.id, item.data()));
    }
  } catch (error) {
    console.error("단어 목록을 Firestore에서 불러오지 못했습니다.", error);
  }

  return fallbackWordLibraryItems();
}

export function buildWordLookup(words: WordLibraryItem[]) {
  const byId = new Map<string, WordLibraryItem>();
  const byWord = new Map<string, WordLibraryItem>();

  for (const word of words) {
    byId.set(word.id.toLowerCase(), word);
    byWord.set(word.word.toLowerCase(), word);
  }

  return {
    byId,
    byWord,
    find(key: string) {
      const normalized = key.toLowerCase();
      return byId.get(normalized) ?? byWord.get(normalized) ?? null;
    },
  };
}
