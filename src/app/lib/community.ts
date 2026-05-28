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
import { auth } from "./firebase";
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
  categoryId?: string;
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
  imageUrls?: string[];
}

export interface UpdateCommunityPostInput {
  postId: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
  imageUrls?: string[];
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
const INCREMENT_POST_VIEW_URL =
  "https://asia-northeast3-hsmocap-d907e.cloudfunctions.net/incrementPostViewHttp";
const SHOULD_USE_LOCAL_COMMUNITY_SAMPLES = import.meta.env.DEV;

const sampleCategories: BoardCategory[] = [
  { id: "study-tip", name: "학습팁", description: "암기법, 복습 루틴, 앱 활용법을 공유하는 공간" },
  { id: "word-compare", name: "단어비교", description: "비슷한 뜻의 단어를 예문과 함께 비교하는 공간" },
  { id: "sentence-practice", name: "문장학습", description: "문장 빈칸, 예문, 실제 사용 맥락을 다루는 공간" },
  { id: "exam-prep", name: "시험준비", description: "TOEIC, 내신, 수능, 회화 시험 준비 전략을 나누는 공간" },
  { id: "resources", name: "자료공유", description: "단어 묶음, 추천 리스트, 복습 세트를 공유하는 공간" },
  { id: "question", name: "질문", description: "단어 뜻, 예문 해석, 학습 루틴을 질문하는 공간" },
  { id: "review", name: "후기", description: "실제 학습 경험과 앱 사용 후기를 공유하는 공간" },
];

export const communityPosts: CommunityPost[] = [
  {
    id: 1,
    author: { name: "단어코치", avatar: "📘", level: "레벨 15" },
    title: "오답 단어는 1일, 3일, 7일 간격으로 다시 보면 오래 갑니다",
    content:
      "단어를 한 번 틀렸다고 바로 오래 외워지는 것은 아닙니다. 저는 오답으로 저장된 단어를 오늘, 3일 뒤, 7일 뒤에 다시 보는 방식으로 정리했습니다.\n\n첫날에는 뜻을 빠르게 확인하고, 3일 뒤에는 예문을 읽고, 7일 뒤에는 문장 퀴즈로 확인하면 기억이 훨씬 안정적으로 남았습니다.",
    categoryId: "study-tip",
    category: "학습팁",
    likes: 42,
    comments: 2,
    views: 318,
    isHot: true,
    timestamp: "1일 전",
  },
  {
    id: 2,
    author: { name: "이해완료", avatar: "🎯", level: "레벨 12" },
    title: "achieve, accomplish, complete는 이렇게 구분하면 쉽습니다",
    content:
      "achieve는 목표나 성과를 얻는 느낌이 강하고, accomplish는 계획한 일을 해냈다는 느낌이 있습니다. complete는 어떤 작업이나 과정을 끝냈다는 뜻에 더 가깝습니다.\n\n예를 들어 'achieve a goal', 'accomplish a mission', 'complete the form'처럼 같이 쓰이는 명사를 함께 외우면 헷갈림이 줄어듭니다.",
    categoryId: "word-compare",
    category: "단어비교",
    likes: 57,
    comments: 2,
    views: 441,
    isHot: true,
    timestamp: "2일 전",
  },
  {
    id: 3,
    author: { name: "문장러버", avatar: "📝", level: "레벨 8" },
    title: "단어 뜻만 외우기보다 문장 빈칸으로 확인하면 실수가 줄어요",
    content:
      "benefit을 '이익'이라고만 외우면 실제 문장에서 바로 떠올리기 어렵습니다. 'Exercise has many health benefits.'처럼 문장 전체를 같이 보면 단어가 쓰이는 위치와 의미가 함께 기억됩니다.\n\n즐겨찾기한 단어는 문장 학습으로 한 번 더 확인하면 단순 암기에서 실제 사용으로 넘어가기 좋습니다.",
    categoryId: "sentence-practice",
    category: "문장학습",
    likes: 49,
    comments: 2,
    views: 390,
    isHot: true,
    timestamp: "3일 전",
  },
  {
    id: 4,
    author: { name: "토익집중", avatar: "🧭", level: "레벨 10" },
    title: "TOEIC 직전에는 빈출 동사와 명사 조합부터 다시 보세요",
    content:
      "시험 전날에는 새로운 단어를 많이 넣기보다 이미 본 단어 중 자주 나오는 조합을 확인하는 것이 효율적입니다.\n\n예를 들어 submit an application, attend a seminar, extend a deadline처럼 동사와 명사를 묶어서 보면 Part 5와 Part 7에서 읽는 속도가 빨라집니다.",
    categoryId: "exam-prep",
    category: "시험준비",
    likes: 36,
    comments: 1,
    views: 276,
    isHot: false,
    timestamp: "4일 전",
  },
  {
    id: 5,
    author: { name: "자료정리러", avatar: "🗂", level: "레벨 9" },
    title: "감정 형용사 12개는 원인과 감정으로 나눠서 외우면 편합니다",
    content:
      "bored와 boring처럼 -ed, -ing가 붙은 형용사는 기준을 잡으면 훨씬 쉽습니다. -ed는 사람이 느끼는 감정, -ing는 그 감정을 일으키는 원인에 가깝습니다.\n\ninterested/interesting, excited/exciting, confused/confusing을 한 묶음으로 저장해두고 예문을 비교해보세요.",
    categoryId: "resources",
    category: "자료공유",
    likes: 31,
    comments: 1,
    views: 254,
    isHot: false,
    timestamp: "5일 전",
  },
  {
    id: 6,
    author: { name: "중급탈출", avatar: "🌱", level: "레벨 7" },
    title: "중급에서 고급 단어로 넘어갈 때 어떤 루틴이 좋을까요?",
    content:
      "초급 단어는 빠르게 넘어가는데, 고급 단어는 뜻이 비슷한 단어가 많아서 자주 헷갈립니다.\n\n즐겨찾기와 복습하기를 같이 쓰는 추천 루틴이 있을까요? 특히 유의어가 많은 단어를 오래 기억하는 방법이 궁금합니다.",
    categoryId: "question",
    category: "질문",
    likes: 18,
    comments: 2,
    views: 167,
    isHot: false,
    timestamp: "6일 전",
  },
  {
    id: 7,
    author: { name: "매일20개", avatar: "✅", level: "레벨 11" },
    title: "하루 20개 목표를 작게 잡으니 꾸준히 하게 됩니다",
    content:
      "처음부터 많은 단어를 외우려고 하면 금방 지치는데, 하루 목표를 20개로 잡고 홈에서 진행률을 보니까 부담이 줄었습니다.\n\n최근 학습 단어와 과거 기록이 같이 보이는 것도 동기부여가 됐습니다. 목표를 작게 잡는 편이 오히려 오래 가네요.",
    categoryId: "review",
    category: "후기",
    likes: 27,
    comments: 1,
    views: 205,
    isHot: false,
    timestamp: "7일 전",
  },
  {
    id: 8,
    author: { name: "문법정리러", avatar: "📎", level: "레벨 13" },
    title: "affect와 effect는 품사부터 나눠서 보면 덜 헷갈립니다",
    content:
      "affect는 주로 동사로 '영향을 미치다'라는 뜻이고, effect는 주로 명사로 '영향, 결과'라는 뜻입니다.\n\nThe weather affects sales. / The effect was immediate.처럼 문장 안 역할을 먼저 보면 뜻보다 빠르게 구분할 수 있습니다.",
    categoryId: "word-compare",
    category: "단어비교",
    likes: 44,
    comments: 1,
    views: 332,
    isHot: false,
    timestamp: "8일 전",
  },
  {
    id: 9,
    author: { name: "즐겨찾기매니저", avatar: "⭐", level: "레벨 14" },
    title: "즐겨찾기는 모든 단어가 아니라 다시 볼 단어만 넣는 게 좋습니다",
    content:
      "즐겨찾기에 단어를 너무 많이 넣으면 다시 보기 어려워집니다. 저는 뜻을 봐도 바로 떠오르지 않는 단어, 비슷한 단어와 자주 헷갈리는 단어, 실제 문장에서 써보고 싶은 단어만 저장합니다.\n\n이 기준을 쓰면 즐겨찾기가 단순 보관함이 아니라 개인 복습 리스트가 됩니다.",
    categoryId: "study-tip",
    category: "학습팁",
    likes: 53,
    comments: 1,
    views: 421,
    isHot: true,
    timestamp: "9일 전",
  },
  {
    id: 10,
    author: { name: "회화준비", avatar: "🎙", level: "레벨 6" },
    title: "말하기 시험 준비는 쉬운 단어를 빠르게 꺼내는 연습이 먼저입니다",
    content:
      "말하기 시험에서는 어려운 단어를 많이 아는 것보다 쉬운 단어를 빠르게 꺼내는 능력이 더 중요할 때가 많습니다.\n\nimportant, useful, convenient 같은 기본 단어를 예문으로 여러 번 말해보면 답변이 끊기는 시간이 줄어듭니다. 즐겨찾기 단어를 문장 학습으로 돌려보는 방식도 효과적입니다.",
    categoryId: "exam-prep",
    category: "시험준비",
    likes: 29,
    comments: 1,
    views: 214,
    isHot: false,
    timestamp: "10일 전",
  },
];

const samplePostSummaries: CommunityPostSummary[] = communityPosts.map((post) => ({
  id: String(post.id),
  categoryId: post.categoryId ?? normalizeCategoryId(post.category),
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
      authorSnapshot: { name: "매일20개" },
      content: "복습 주기가 구체적이라 바로 따라 하기 좋네요. 오답 단어에 먼저 적용해보겠습니다.",
      createdAt: null,
      updatedAt: null,
    },
    {
      id: "1-2",
      postId: "1",
      userId: "sample-comment-user-2",
      authorSnapshot: { name: "문장러버" },
      content: "7일 차에 문장 퀴즈로 확인하는 방식이 특히 좋은 것 같아요.",
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
      content: "collocation으로 묶어서 보니까 차이가 훨씬 선명해지네요.",
      createdAt: null,
      updatedAt: null,
    },
    {
      id: "2-2",
      postId: "2",
      userId: "sample-comment-user-4",
      authorSnapshot: { name: "단어메이트" },
      content: "complete the form 예문은 시험 지문에서도 자주 보이는 표현이라 유용합니다.",
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

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeImageUrls(data: DocumentData): string[] {
  if (Array.isArray(data.imageUrls)) {
    return data.imageUrls.filter((value: unknown): value is string => typeof value === "string" && value.trim() !== "");
  }

  const imageUrl = stringValue(data.imageUrl);
  return imageUrl ? [imageUrl] : [];
}

function toCommunityPostSummary(id: string, data: DocumentData): CommunityPostSummary {
  return {
    id,
    categoryId: stringValue(data.categoryId, normalizeCategoryId(stringValue(data.category, "free"))),
    categoryName: stringValue(data.categoryName, stringValue(data.category, "미분류")),
    userId: stringValue(data.userId, stringValue(data.authorId)),
    authorSnapshot: {
      name: stringValue(data.authorSnapshot?.name, stringValue(data.authorName, "익명")),
    },
    title: String(data.title ?? ""),
    body: stringValue(data.body, stringValue(data.content)),
    likeCount: numberValue(data.likeCount, numberValue(data.likes)),
    commentCount: numberValue(data.commentCount, numberValue(data.comments)),
    viewCount: numberValue(data.viewCount, numberValue(data.views)),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    imageUrls: normalizeImageUrls(data),
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
  if (SHOULD_USE_LOCAL_COMMUNITY_SAMPLES) {
    return sampleCategories;
  }

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
  if (SHOULD_USE_LOCAL_COMMUNITY_SAMPLES) {
    return samplePostSummaries.filter((post) =>
      categoryId && categoryId !== "all" ? post.categoryId === categoryId : true,
    );
  }

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
    imageUrls: input.imageUrls ?? [],
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
    imageUrls: input.imageUrls ?? [],
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
  if (SHOULD_USE_LOCAL_COMMUNITY_SAMPLES) {
    return samplePostSummaries.find((post) => post.id === postId) ?? null;
  }

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

export async function incrementPostView(postId: string): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Authentication is required to increment post views");
  }

  const response = await fetch(INCREMENT_POST_VIEW_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId }),
  });

  if (!response.ok) {
    throw new Error(`Post view increment failed: ${response.status}`);
  }
}

export async function listPostComments(postId: string): Promise<CommunityCommentSummary[]> {
  if (SHOULD_USE_LOCAL_COMMUNITY_SAMPLES) {
    return sampleCommentsByPostId[postId] ?? [];
  }

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
