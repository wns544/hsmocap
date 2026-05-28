import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  FolderOpen,
  Layers3,
  MessageCircle,
  Search,
  Star,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { formatCommunityTimestamp, listBookmarkedPosts, type CommunityPostSummary } from "../lib/community";
import { listFavoriteWords, type FavoriteWordItem } from "../lib/favoriteWords";

type FavoriteTabId = "words" | "sentences" | "posts" | "review" | "collections";

const favoriteTabs: Array<{
  id: FavoriteTabId;
  label: string;
  description: string;
}> = [
  { id: "words", label: "단어", description: "저장한 단어를 빠르게 확인합니다" },
  { id: "sentences", label: "문장", description: "예문 학습으로 바로 이어갑니다" },
  { id: "posts", label: "게시글", description: "커뮤니티 저장 글을 모아봅니다" },
  { id: "review", label: "복습 우선", description: "숙련도가 낮은 단어부터 봅니다" },
  { id: "collections", label: "컬렉션", description: "목적별 학습 묶음을 보여줍니다" },
];

function formatAddedDate(date: Date | null) {
  if (!date) return "추가일 정보 없음";

  return `${date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} 추가`;
}

function getWordSearchText(item: FavoriteWordItem) {
  return `${item.word} ${item.meaning} ${item.level}`.toLowerCase();
}

function getPostSearchText(post: CommunityPostSummary) {
  return `${post.title} ${post.body} ${post.authorSnapshot.name} ${post.categoryName}`.toLowerCase();
}

function FavoriteWordCard({ item }: { item: FavoriteWordItem }) {
  return (
    <Link
      to={`/app/words/${encodeURIComponent(item.id)}?word=${encodeURIComponent(item.word)}`}
      state={{ word: { ...item, isFavorite: true } }}
    >
      <div className="bg-white rounded-2xl p-5 border border-border active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              <h3 className="text-lg">{item.word}</h3>
            </div>
            <p className="text-muted-foreground mb-3">{item.meaning}</p>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {item.level}
              </Badge>
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${item.mastery}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{item.mastery}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{formatAddedDate(item.addedAt)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

function SavedPostCard({ post }: { post: CommunityPostSummary }) {
  return (
    <Link to={`/app/community/${post.id}`}>
      <div className="bg-white rounded-2xl p-5 border border-border active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/30">
                {post.categoryName}
              </Badge>
            </div>
            <h4 className="text-base mb-2">{post.title}</h4>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.body}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{post.authorSnapshot.name}</span>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{post.likeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{post.commentCount}</span>
              </div>
              <span>{formatCommunityTimestamp(post.createdAt)}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export default function Favorites() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FavoriteTabId>("words");
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWordItem[]>([]);
  const [savedPosts, setSavedPosts] = useState<CommunityPostSummary[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setFavoriteWords([]);
      setSavedPosts([]);
      setIsLoadingWords(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingWords(true);

    void Promise.all([listFavoriteWords(user.uid), listBookmarkedPosts(user.uid)])
      .then(([words, posts]) => {
        if (!isMounted) return;
        setFavoriteWords(words);
        setSavedPosts(posts);
      })
      .catch((error) => {
        console.error("즐겨찾기 데이터를 불러오지 못했습니다.", error);
        if (!isMounted) return;
        setFavoriteWords([]);
        setSavedPosts([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingWords(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredFavoriteWords = useMemo(() => {
    if (!normalizedSearch) return favoriteWords;
    return favoriteWords.filter((item) => getWordSearchText(item).includes(normalizedSearch));
  }, [favoriteWords, normalizedSearch]);

  const filteredSavedPosts = useMemo(() => {
    if (!normalizedSearch) return savedPosts;
    return savedPosts.filter((post) => getPostSearchText(post).includes(normalizedSearch));
  }, [normalizedSearch, savedPosts]);

  const reviewPriorityWords = useMemo(
    () =>
      filteredFavoriteWords
        .filter((item) => item.mastery < 70)
        .sort((left, right) => left.mastery - right.mastery),
    [filteredFavoriteWords],
  );

  const collectionItems = [
    {
      title: "플래시카드 집중",
      description: `${favoriteWords.length}개 단어를 카드로 빠르게 복습`,
      icon: Zap,
      to: "/app/flashcard-favorites",
    },
    {
      title: "문장으로 복습",
      description: "저장한 단어를 예문 흐름으로 확인",
      icon: BookOpen,
      to: "/app/sentence-favorites",
    },
    {
      title: "저장한 게시글",
      description: `${savedPosts.length}개 커뮤니티 글을 다시 보기`,
      icon: Bookmark,
      onClick: () => setActiveTab("posts"),
    },
    {
      title: "복습 우선 단어",
      description: `${reviewPriorityWords.length}개 낮은 숙련도 단어부터 정리`,
      icon: Layers3,
      onClick: () => setActiveTab("review"),
    },
  ];

  const activeTabDescription = favoriteTabs.find((tab) => tab.id === activeTab)?.description;

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-yellow-500 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl mb-1">즐겨찾기</h1>
            <p className="text-white/80">단어, 문장, 게시글을 목적별로 나눠서 다시 볼 수 있어요</p>
          </div>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl mb-1">{favoriteWords.length}</div>
              <div className="text-xs text-white/80">단어</div>
            </div>
            <div>
              <div className="text-2xl mb-1">{savedPosts.length}</div>
              <div className="text-xs text-white/80">게시글</div>
            </div>
            <div>
              <div className="text-2xl mb-1">{reviewPriorityWords.length}</div>
              <div className="text-xs text-white/80">복습 우선</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="즐겨찾기에서 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-12 h-12 rounded-xl bg-white border-border"
          />
        </div>

        <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {favoriteTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{activeTabDescription}</p>
        </div>

        {activeTab === "words" && (
          <>
            {filteredFavoriteWords.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl mb-2">
                  {isLoadingWords ? "즐겨찾기를 불러오는 중입니다" : "즐겨찾기 단어가 없습니다"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "검색 결과가 없습니다" : "단어 상세 화면에서 별표를 눌러 추가해보세요"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFavoriteWords.map((item) => (
                  <FavoriteWordCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "sentences" && (
          <div className="space-y-3">
            <Link to="/app/sentence-favorites">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-5 active:scale-[0.98] transition-transform shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">문장 학습 시작</h3>
                </div>
                <p className="text-sm text-white/80">즐겨찾기 단어를 문장 안에서 다시 익혀보세요</p>
              </div>
            </Link>
            <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
              현재 즐겨찾기 단어 {filteredFavoriteWords.length}개를 문장 학습 후보로 사용할 수 있어요.
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <>
            {filteredSavedPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다." : "아직 저장한 게시글이 없습니다."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSavedPosts.map((post) => (
                  <SavedPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "review" && (
          <>
            {reviewPriorityWords.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
                숙련도 70% 미만의 즐겨찾기 단어가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {reviewPriorityWords.map((item) => (
                  <FavoriteWordCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "collections" && (
          <div className="space-y-3">
            {collectionItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="bg-white rounded-2xl p-5 border border-border active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              );

              if (item.to) {
                return (
                  <Link key={item.title} to={item.to}>
                    {content}
                  </Link>
                );
              }

              return (
                <button key={item.title} type="button" onClick={item.onClick} className="w-full text-left">
                  {content}
                </button>
              );
            })}
          </div>
        )}

        {favoriteWords.length > 0 && (
          <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h3>즐겨찾기 활용 팁</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>자주 헷갈리는 단어는 복습 우선 탭에서 먼저 확인하세요</li>
              <li>문장 학습 탭은 뜻만 외운 단어를 실제 맥락으로 연결할 때 좋아요</li>
              <li>좋은 커뮤니티 글은 게시글 탭에 모아두고 루틴처럼 다시 볼 수 있어요</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
