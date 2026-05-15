import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface CommunityPost {
  id: number;
  author: {
    name: string;
    avatar: string;
    level: string;
  };
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  views: number;
  isHot: boolean;
  timestamp: string;
  hasImage?: boolean;
  imageUrl?: string;
}

export interface BoardCategory {
  id: string;
  name: string;
  description?: string;
}

export interface CommunityPostSummary {
  id: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  authorSnapshot: {
    name: string;
  };
  title: string;
  body: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  imageUrls: string[];
}

export interface CommunityCommentSummary {
  id: string;
  postId: string;
  userId: string;
  authorSnapshot: {
    name: string;
  };
  content: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCommunityPostInput {
  categoryId: string;
  categoryName: string;
  userId: string;
  authorName: string;
  title: string;
  body: string;
}

export interface UpdateCommunityPostInput {
  postId: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
}

export interface CreateCommunityCommentInput {
  postId: string;
  userId: string;
  authorName: string;
  content: string;
}

export interface UpdateCommunityCommentInput {
  postId: string;
  commentId: string;
  content: string;
}

const SAVED_COMMUNITY_POSTS_KEY = "wordy.savedCommunityPosts";

const sampleCategories: BoardCategory[] = [
  { id: "free", name: "자유", description: "자유롭게 학습 경험을 나누는 공간" },
  { id: "question", name: "질문", description: "학습 질문과 답변" },
  { id: "review", name: "후기", description: "앱 사용 후기와 학습 후기" },
];

export const communityPosts: CommunityPost[] = [
  {
    id: 1,
    author: { name: "영어고수", avatar: "📘", level: "레벨 15" },
    title: "영어 단어 복기 루틴 공유합니다",
    content:
      "아침에 학습한 단어를 저녁에 다시 보면서 예문까지 한 번 더 확인하는 방식으로 정리하고 있어요. 반복 노출이 생각보다 큰 도움이 되더라고요.",
    category: "학습팁",
    likes: 247,
    comments: 32,
    views: 1240,
    isHot: true,
    timestamp: "2시간 전",
  },
  {
    id: 2,
    author: { name: "단어마스터", avatar: "🎯", level: "레벨 12" },
    title: "토익 고득점을 위한 필수 단어 리스트",
    content:
      "시험 직전에 자주 헷갈리는 단어들을 따로 묶어서 봤더니 복습 효율이 많이 올라갔습니다. 우선순위 단어 정리가 핵심이었어요.",
    category: "시험준비",
    likes: 189,
    comments: 24,
    views: 892,
    isHot: true,
    timestamp: "5시간 전",
  },
  {
    id: 3,
    author: { name: "영어러버", avatar: "📝", level: "레벨 8" },
    title: "어원으로 단어 외우기보다 예문이 더 쉬웠어요",
    content:
      "예문을 자주 보고 직접 빈칸을 채워보는 방식이 저한테는 더 잘 맞았습니다. 문맥으로 기억하는 게 오래 가네요.",
    category: "학습팁",
    likes: 156,
    comments: 18,
    views: 654,
    isHot: false,
    timestamp: "1일 전",
  },
  {
    id: 4,
    author: { name: "초보학습자", avatar: "🌱", level: "레벨 3" },
    title: "영어 공부 시작할 때 가장 막막했던 것",
    content:
      "처음에는 무엇부터 외워야 할지 막막했는데, 하루 목표 단어를 정하고 복습 주기를 지키는 것만으로도 훨씬 안정감이 생겼어요.",
    category: "후기",
    likes: 92,
    comments: 15,
    views: 421,
    isHot: false,
    timestamp: "1일 전",
    hasImage: true,
    imageUrl:
      "https://images.unsplash.com/photo-1652173410636-4be431f4a2de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdsaXNoJTIwdm9jYWJ1bGFyeSUyMHN0dWR5JTIwbm90ZWJvb2t8ZW58MXx8fHwxNzc0ODA2OTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    author: { name: "유학준비", avatar: "✈️", level: "레벨 18" },
    title: "실생활에서 자주 듣는 영어 표현 모음",
    content:
      "짧은 표현을 자주 반복해서 듣고 말해보는 방식이 도움이 됐어요. 길게 외우기보다 자주 노출되는 표현부터 익히는 걸 추천합니다.",
    category: "표현",
    likes: 312,
    comments: 41,
    views: 1567,
    isHot: true,
    timestamp: "12시간 전",
  },
];

const samplePostSummaries: CommunityPostSummary[] = communityPosts.map((post) => ({
  id: String(post.id),
  categoryId: normalizeCategoryId(post.category),
  categoryName: post.category,
  userId: `sample-user-${post.id}`,
  authorSnapshot: {
    name: post.author.name,
  },
  title: post.title,
  body: post.content,
  likeCount: post.likes,
  commentCount: post.comments,
  viewCount: post.views,
  createdAt: null,
  updatedAt: null,
  imageUrls: post.imageUrl ? [post.imageUrl] : [],
}));

const sampleCommentsByPostId: Record<string, CommunityCommentSummary[]> = {
  "1": [
    {
      id: "1-1",
      postId: "1",
      userId: "sample-comment-user-1",
      authorSnapshot: { name: "매일영어" },
      content: "복습 루틴을 이렇게 구체적으로 정리해주셔서 바로 따라 해보고 싶어요.",
      createdAt: null,
      updatedAt: null,
    },
    {
      id: "1-2",
      postId: "1",
      userId: "sample-comment-user-2",
      authorSnapshot: { name: "초보학습자" },
      content: "짧게 자주 보는 방식이 저한테도 잘 맞을 것 같아요. 감사합니다.",
      createdAt: null,
      updatedAt: null,
    },
  ],
  "2": [
    {
      id: "2-1",
      postId: "2",
      userId: "sample-comment-user-3",
      authorSnapshot: { name: "토익집중" },
      content: "시험 직전에 단어를 이렇게 묶어서 보면 확실히 정리가 잘 되더라고요.",
      createdAt: null,
      updatedAt: null,
    },
  ],
};

function normalizeCategoryId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
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

function toCommunityPostSummary(id: string, data: DocumentData): CommunityPostSummary {
  return {
    id,
    categoryId: String(data.categoryId ?? ""),
    categoryName: String(data.categoryName ?? "미분류"),
    userId: String(data.userId ?? ""),
    authorSnapshot: {
      name: String(data.authorSnapshot?.name ?? "익명"),
    },
    title: String(data.title ?? ""),
    body: String(data.body ?? ""),
    likeCount: Number(data.likeCount ?? 0),
    commentCount: Number(data.commentCount ?? 0),
    viewCount: Number(data.viewCount ?? 0),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    imageUrls: Array.isArray(data.imageUrls)
      ? data.imageUrls.filter((value: unknown): value is string => typeof value === "string")
      : [],
  };
}

function toCommunityCommentSummary(
  postId: string,
  id: string,
  data: DocumentData,
): CommunityCommentSummary {
  return {
    id,
    postId,
    userId: String(data.userId ?? ""),
    authorSnapshot: {
      name: String(data.authorSnapshot?.name ?? "익명"),
    },
    content: String(data.content ?? ""),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listBoardCategories(): Promise<BoardCategory[]> {
  try {
    const snapshot = await getDocs(query(collection(db, "boardCategories"), limit(20)));
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: String(doc.data().name ?? "이름 없는 카테고리"),
      description:
        typeof doc.data().description === "string" ? doc.data().description : undefined,
    }));

    if (categories.length > 0) {
      return categories.sort((left, right) => left.name.localeCompare(right.name, "ko"));
    }
  } catch {
    // Firestore가 아직 준비되지 않았거나 권한 문제가 있으면 샘플 카테고리로 안전하게 폴백한다.
  }

  return sampleCategories;
}

export async function listCommunityPosts(categoryId?: string): Promise<CommunityPostSummary[]> {
  try {
    const postsRef = collection(db, "posts");
    const postQuery =
      categoryId && categoryId !== "all"
        ? query(postsRef, where("categoryId", "==", categoryId), limit(30))
        : query(postsRef, limit(30));

    const snapshot = await getDocs(postQuery);
    const posts = snapshot.docs.map((doc) => toCommunityPostSummary(doc.id, doc.data()));

    if (posts.length > 0) {
      return posts.sort((left, right) => {
        const leftTime = left.createdAt?.getTime() ?? 0;
        const rightTime = right.createdAt?.getTime() ?? 0;
        return rightTime - leftTime;
      });
    }
  } catch {
    // Firestore 조회 실패 시 샘플 게시글을 보여주어 화면이 죽지 않도록 한다.
  }

  return samplePostSummaries.filter((post) =>
    categoryId && categoryId !== "all" ? post.categoryId === categoryId : true,
  );
}

export async function createCommunityPost(input: CreateCommunityPostInput): Promise<string> {
  const snapshot = await addDoc(collection(db, "posts"), {
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    userId: input.userId,
    authorSnapshot: {
      name: input.authorName,
    },
    title: input.title,
    body: input.body,
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    imageUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return snapshot.id;
}

export async function updateCommunityPost(input: UpdateCommunityPostInput): Promise<void> {
  await updateDoc(doc(db, "posts", input.postId), {
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    title: input.title,
    body: input.body,
    updatedAt: serverTimestamp(),
  });
}

export async function createPostComment(input: CreateCommunityCommentInput): Promise<string> {
  const snapshot = await addDoc(collection(db, "posts", input.postId, "comments"), {
    userId: input.userId,
    authorSnapshot: {
      name: input.authorName,
    },
    content: input.content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return snapshot.id;
}

export async function updatePostComment(input: UpdateCommunityCommentInput): Promise<void> {
  await updateDoc(doc(db, "posts", input.postId, "comments", input.commentId), {
    content: input.content,
    updatedAt: serverTimestamp(),
  });
}

export async function isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, "posts", postId, "likes", userId));
  return snapshot.exists();
}

export async function togglePostLike(postId: string, userId: string): Promise<boolean> {
  const likeRef = doc(db, "posts", postId, "likes", userId);
  const snapshot = await getDoc(likeRef);

  if (snapshot.exists()) {
    await deleteDoc(likeRef);
    return false;
  }

  await setDoc(likeRef, {
    userId,
    createdAt: serverTimestamp(),
  });

  return true;
}

export async function isPostBookmarkedByUser(postId: string, userId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, "users", userId, "postBookmarks", postId));
  return snapshot.exists();
}

export async function togglePostBookmark(postId: string, userId: string): Promise<boolean> {
  const bookmarkRef = doc(db, "users", userId, "postBookmarks", postId);
  const snapshot = await getDoc(bookmarkRef);

  if (snapshot.exists()) {
    await deleteDoc(bookmarkRef);
    return false;
  }

  await setDoc(bookmarkRef, {
    postId,
    savedAt: serverTimestamp(),
  });

  return true;
}

export async function listBookmarkedPostIds(userId: string): Promise<string[]> {
  const snapshot = await getDocs(query(collection(db, "users", userId, "postBookmarks"), limit(100)));

  return snapshot.docs
    .map((item) => String(item.data().postId ?? item.id))
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

export async function listBookmarkedPosts(userId: string): Promise<CommunityPostSummary[]> {
  const bookmarkedIds = await listBookmarkedPostIds(userId);
  const posts = await Promise.all(bookmarkedIds.map((postId) => getCommunityPostDetail(postId)));

  return posts.filter((post): post is CommunityPostSummary => post !== null);
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  const batch = writeBatch(db);

  const commentsSnapshot = await getDocs(collection(db, "posts", postId, "comments"));
  commentsSnapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  const likesSnapshot = await getDocs(collection(db, "posts", postId, "likes"));
  likesSnapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  batch.delete(doc(db, "posts", postId));
  await batch.commit();
}

export async function deletePostComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
}

export async function getCommunityPostDetail(
  postId: string,
): Promise<CommunityPostSummary | null> {
  try {
    const snapshot = await getDoc(doc(db, "posts", postId));
    if (snapshot.exists()) {
      return toCommunityPostSummary(snapshot.id, snapshot.data());
    }
  } catch {
    // Firestore 조회 실패 시 샘플 데이터로 폴백한다.
  }

  return samplePostSummaries.find((post) => post.id === postId) ?? null;
}

export async function listPostComments(postId: string): Promise<CommunityCommentSummary[]> {
  try {
    const commentsRef = collection(db, "posts", postId, "comments");
    const snapshot = await getDocs(query(commentsRef, limit(50)));
    const comments = snapshot.docs.map((item) =>
      toCommunityCommentSummary(postId, item.id, item.data()),
    );

    if (comments.length > 0) {
      return comments.sort((left, right) => {
        const leftTime = left.createdAt?.getTime() ?? 0;
        const rightTime = right.createdAt?.getTime() ?? 0;
        return leftTime - rightTime;
      });
    }
  } catch {
    // Firestore 조회 실패 시 샘플 댓글로 폴백한다.
  }

  return sampleCommentsByPostId[postId] ?? [];
}

export function formatCommunityTimestamp(value: Date | null): string {
  if (!value) return "방금 전";

  const diffMs = Date.now() - value.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes}분 전`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours}시간 전`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days}일 전`;
}

export function getSavedCommunityPostIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SAVED_COMMUNITY_POSTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : [];
  } catch {
    return [];
  }
}

export function isCommunityPostSaved(postId: number): boolean {
  return getSavedCommunityPostIds().includes(postId);
}

export function toggleSavedCommunityPost(postId: number): number[] {
  const savedIds = getSavedCommunityPostIds();
  const nextIds = savedIds.includes(postId) ? savedIds.filter((id) => id !== postId) : [...savedIds, postId];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAVED_COMMUNITY_POSTS_KEY, JSON.stringify(nextIds));
  }

  return nextIds;
}
