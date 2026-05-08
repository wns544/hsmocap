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
  const avatar = "avatarUrl" in snapshot && typeof snapshot.avatarUrl === "string" ? snapshot.avatarUrl : "";
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
    categoryName:
      typeof data.categoryName === "string" && data.categoryName.trim().length > 0 ? data.categoryName : "미분류",
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

export function buildClientCommentRecord(input: {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorLevel: number;
  content: string;
  createdAtMillis?: number;
}): CommunityCommentRecord {
  return {
    id: input.id,
    authorId: "",
    author: {
      name: input.authorName,
      avatar: input.authorAvatar,
      level: `레벨 ${input.authorLevel}`,
    },
    content: input.content,
    likes: 0,
    timestamp: formatTimestamp({
      toDate: () => new Date(input.createdAtMillis ?? Date.now()),
    }),
  };
}
