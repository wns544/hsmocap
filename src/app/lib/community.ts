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

const SAVED_COMMUNITY_POSTS_KEY = "wordy.savedCommunityPosts";

export const communityPosts: CommunityPost[] = [
  {
    id: 1,
    author: { name: "영어고수", avatar: "👩", level: "레벨 15" },
    title: "영어 단어 암기 효과적인 방법 공유합니다",
    content: "제가 실제로 쓰고 있는 단어 암기 루틴과 복습 흐름을 정리해봤어요. 짧게 자주 보고, 예문으로 다시 확인하는 방식이 특히 효과적이었습니다.",
    category: "학습팁",
    likes: 247,
    comments: 32,
    views: 1240,
    isHot: true,
    timestamp: "2시간 전",
  },
  {
    id: 2,
    author: { name: "단어마스터", avatar: "🧠", level: "레벨 12" },
    title: "토익 고득점을 위한 필수 단어 리스트",
    content: "시험 준비 중이라면 자주 나오는 단어부터 묶어서 보는 방법을 추천해요. 빈출 표현을 함께 익히면 기억이 더 오래갑니다.",
    category: "시험대비",
    likes: 189,
    comments: 24,
    views: 892,
    isHot: true,
    timestamp: "5시간 전",
  },
  {
    id: 3,
    author: { name: "영어러버", avatar: "🎯", level: "레벨 8" },
    title: "어원으로 단어 외우기, 생각보다 쉬워요",
    content: "접두사와 접미사만 알아도 낯선 단어의 의미를 유추하기 쉬워집니다. 단어를 분해해서 보면 암기 부담이 훨씬 줄어들어요.",
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
    title: "영어 공부 시작한 지 한 달 된 후기",
    content: "단어를 짧고 자주 보는 습관이 생각보다 도움이 많이 됐어요. 처음엔 부담 없이 작은 양부터 시작하는 게 좋았습니다.",
    category: "후기",
    likes: 92,
    comments: 15,
    views: 421,
    isHot: false,
    timestamp: "1일 전",
    hasImage: true,
    imageUrl: "https://images.unsplash.com/photo-1652173410636-4be431f4a2de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdsaXNoJTIwdm9jYWJ1bGFyeSUyMHN0dWR5JTIwbm90ZWJvb2t8ZW58MXx8fHwxNzc0ODA2OTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    author: { name: "유학준비", avatar: "✈️", level: "레벨 18" },
    title: "실생활에서 자주 듣는 영어 표현 모음",
    content: "짧고 자주 쓰는 표현들을 정리해두면 회화 감각을 익히는 데 도움이 됩니다. 한 번에 많이보다 반복 노출이 중요해요.",
    category: "표현",
    likes: 312,
    comments: 41,
    views: 1567,
    isHot: true,
    timestamp: "12시간 전",
  },
];

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
