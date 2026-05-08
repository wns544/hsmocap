import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export interface CommunityCategoryOption {
  id: string;
  name: string;
}

export interface CommunityPostRecord {
  id: string;
  authorId: string;
  author: {
    name: string;
    avatar: string;
    level: string;
  };
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  likes: number;
  comments: number;
  views: number;
  isHot: boolean;
  timestamp: string;
  hasImage: boolean;
  imageUrl?: string;
}

export interface CommunityCommentRecord {
  id: string;
  authorId: string;
  author: {
    name: string;
    avatar: string;
    level: string;
  };
  content: string;
  likes: number;
  timestamp: string;
}

interface FirestoreTimestampLike {
  toDate?: () => Date;
}

const SAVED_COMMUNITY_POSTS_KEY = "wordy.savedCommunityPosts";

export const communityPosts = [
  {
    id: 1,
    author: { name: "영어고수", avatar: "영", level: "레벨 15" },
    title: "영단어 외우기에 효과적인 방법 공유합니다",
    content: "짧게 자주 보고, 예문으로 다시 확인하는 방식이 가장 오래 갑니다.",
    category: "학습팁",
    likes: 247,
    comments: 32,
    views: 1240,
    isHot: true,
    timestamp: "2시간 전",
  },
];

function formatTimestamp(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as FirestoreTimestampLike).toDate === "function"
  ) {
    return formatDistanceToNow((value as FirestoreTimestampLike).toDate!(), {
      addSuffix: true,
      locale: ko,
    });
  }

  return "방금 전";
}

function buildAuthorSnapshot(authorSnapshot: unknown) {
  const snapshot = typeof authorSnapshot === "object" && authorSnapshot ? authorSnapshot : {};
  const nickname =
    "nickname" in snapshot && typeof snapshot.nickname === "string" && snapshot.nickname.trim().length > 0
      ? snapshot.nickname
      : "Unknown";
  const avatar =
    "avatarUrl" in snapshot && typeof snapshot.avatarUrl === "string" ? snapshot.avatarUrl : "";
  const level =
    "level" in snapshot && typeof snapshot.level === "number" ? `레벨 ${snapshot.level}` : "레벨 정보 없음";

  return {
    name: nickname,
    avatar,
    level,
  };
}

export function mapPostRecord(id: string, data: Record<string, unknown>): CommunityPostRecord {
  const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : [];

  return {
    id,
    authorId: typeof data.authorId === "string" ? data.authorId : "",
    author: buildAuthorSnapshot(data.authorSnapshot),
    title: typeof data.title === "string" && data.title.trim().length > 0 ? data.title : "제목 없음",
    content: typeof data.content === "string" ? data.content : "",
    categoryId: typeof data.categoryId === "string" ? data.categoryId : "unknown",
    categoryName: typeof data.categoryName === "string" && data.categoryName.trim().length > 0 ? data.categoryName : "미분류",
    likes: typeof data.likeCount === "number" ? data.likeCount : 0,
    comments: typeof data.commentCount === "number" ? data.commentCount : 0,
    views: typeof data.viewCount === "number" ? data.viewCount : 0,
    isHot: Boolean(data.isHot),
    timestamp: formatTimestamp(data.createdAt),
    hasImage: imageUrls.length > 0,
    imageUrl: typeof imageUrls[0] === "string" ? imageUrls[0] : undefined,
  };
}

export function mapCommentRecord(id: string, data: Record<string, unknown>): CommunityCommentRecord {
  return {
    id,
    authorId: typeof data.authorId === "string" ? data.authorId : "",
    author: buildAuthorSnapshot(data.authorSnapshot),
    content: typeof data.content === "string" ? data.content : "",
    likes: typeof data.likeCount === "number" ? data.likeCount : 0,
    timestamp: formatTimestamp(data.createdAt),
  };
}

export function getSavedCommunityPostIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SAVED_COMMUNITY_POSTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [];
  }
}

export function isCommunityPostSaved(postId: string | number): boolean {
  return getSavedCommunityPostIds().includes(String(postId));
}

export function toggleSavedCommunityPost(postId: string | number): string[] {
  const targetId = String(postId);
  const savedIds = getSavedCommunityPostIds();
  const nextIds = savedIds.includes(targetId) ? savedIds.filter((id) => id !== targetId) : [...savedIds, targetId];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(SAVED_COMMUNITY_POSTS_KEY, JSON.stringify(nextIds));
  }

  return nextIds;
}
