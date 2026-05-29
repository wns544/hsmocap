import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  FolderOpen,
  Grid2X2,
  MessageCircle,
  Search,
  Star,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  formatCommunityTimestamp,
  getCommunityCategoryStyle,
  listBookmarkedPosts,
  type CommunityPostSummary,
} from "../lib/community";
import { listFavoriteWords, type FavoriteWordItem } from "../lib/favoriteWords";

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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default function Favorites() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
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

  const wordPreview = filteredFavoriteWords.slice(0, 3);
  const sentencePreview = filteredFavoriteWords.slice(0, 3);
  const postPreview = filteredSavedPosts.slice(0, 2);
  const collectionItems = [
    {
      title: "플래시카드",
      description: `${favoriteWords.length}개`,
      icon: Zap,
      to: "/app/flashcard-favorites",
    },
    {
      title: "문장학습",
      description: `${favoriteWords.length}개`,
      icon: BookOpen,
      to: "/app/sentence-favorites",
    },
    {
      title: "복습우선",
      description: `${reviewPriorityWords.length}개`,
      icon: Star,
      to: "/app/review",
    },
    {
      title: "게시글",
      description: `${savedPosts.length}개`,
      icon: Bookmark,
      to: "/app/community",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-yellow-500 px-6 pb-8 pt-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Star className="h-6 w-6 fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="mb-1 text-3xl">즐겨찾기</h1>
            <p className="text-white/80">단어, 문장, 게시글, 컬렉션을 한눈에 모아보세요</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
          <div>
            <div className="text-xl">{favoriteWords.length}</div>
            <div className="text-xs text-white/80">단어</div>
          </div>
          <div>
            <div className="text-xl">{favoriteWords.length}</div>
            <div className="text-xs text-white/80">문장</div>
          </div>
          <div>
            <div className="text-xl">{savedPosts.length}</div>
            <div className="text-xs text-white/80">게시글</div>
          </div>
          <div>
            <div className="text-xl">{collectionItems.length}</div>
            <div className="text-xs text-white/80">컬렉션</div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="즐겨찾기에서 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-12 rounded-xl border-border bg-white pl-12"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg">단어</h2>
                  <p className="text-xs text-muted-foreground">{filteredFavoriteWords.length}개</p>
                </div>
              </div>
              <Link to="/app/flashcard-favorites" className="text-primary">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {wordPreview.length === 0 ? (
              <EmptyState text={isLoadingWords ? "불러오는 중입니다." : "저장한 단어가 없습니다."} />
            ) : (
              <div className="space-y-3">
                {wordPreview.map((item) => (
                  <Link
                    key={item.id}
                    to={`/app/words/${encodeURIComponent(item.id)}?word=${encodeURIComponent(item.word)}`}
                    state={{ word: { ...item, isFavorite: true } }}
                    className="block"
                  >
                    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base">{item.word}</div>
                          <div className="truncate text-sm text-muted-foreground">{item.meaning}</div>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {item.level}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg">문장</h2>
                  <p className="text-xs text-muted-foreground">{sentencePreview.length}개 후보</p>
                </div>
              </div>
              <Link to="/app/sentence-favorites" className="text-primary">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {sentencePreview.length === 0 ? (
              <EmptyState text="문장 학습 후보가 없습니다." />
            ) : (
              <div className="space-y-3">
                {sentencePreview.map((item) => (
                  <Link key={item.id} to="/app/sentence-favorites" className="block">
                    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base">{item.word}</div>
                          <div className="truncate text-sm text-muted-foreground">{item.meaning}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{formatAddedDate(item.addedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Bookmark className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-lg">게시글</h2>
                  <p className="text-xs text-muted-foreground">{filteredSavedPosts.length}개</p>
                </div>
              </div>
              <Link to="/app/community" className="text-primary">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {postPreview.length === 0 ? (
              <EmptyState text="저장한 게시글이 없습니다." />
            ) : (
              <div className="space-y-3">
                {postPreview.map((post) => {
                  const categoryStyle = getCommunityCategoryStyle(post.categoryId, post.categoryName);

                  return (
                    <Link key={post.id} to={`/app/community/${post.id}`} className="block">
                      <div className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className={categoryStyle.badgeClassName}>
                            {post.categoryName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatCommunityTimestamp(post.createdAt)}</span>
                        </div>
                        <h3 className="line-clamp-1 text-base">{post.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{post.authorSnapshot.name}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {post.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Grid2X2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg">컬렉션</h2>
                  <p className="text-xs text-muted-foreground">{collectionItems.length}개</p>
                </div>
              </div>
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {collectionItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link key={item.title} to={item.to} className="rounded-xl border border-border p-3 active:scale-[0.98]">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
