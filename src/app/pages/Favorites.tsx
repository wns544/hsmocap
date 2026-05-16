import { useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Bookmark, ChevronRight, MessageCircle, Search, Star, ThumbsUp, Zap } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { formatCommunityTimestamp, listBookmarkedPosts, type CommunityPostSummary } from "../lib/community";
import { listFavoriteWords, type FavoriteWordItem } from "../lib/favoriteWords";

function formatAddedDate(date: Date | null) {
  if (!date) return "추가일 정보 없음";

  return `${date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} 추가`;
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

  const filteredFavorites = favoriteWords.filter(
    (item) =>
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) || item.meaning.includes(searchQuery),
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-yellow-500 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl mb-1">즐겨찾기</h1>
            <p className="text-white/80">자주 보는 단어와 저장한 게시글을 모아보세요</p>
          </div>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl mb-1">{favoriteWords.length}</div>
              <div className="text-sm text-white/80">즐겨찾기한 단어</div>
            </div>
            <div>
              <div className="text-2xl mb-1">{savedPosts.length}</div>
              <div className="text-sm text-white/80">저장한 게시글</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {favoriteWords.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link to="/app/flashcard-favorites">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-5 active:scale-[0.98] transition-transform shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">플래시카드</h3>
                </div>
                <p className="text-sm text-white/80">즐겨찾기 단어 학습</p>
              </div>
            </Link>

            <Link to="/app/sentence-favorites">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-5 active:scale-[0.98] transition-transform shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">문장 학습</h3>
                </div>
                <p className="text-sm text-white/80">문장으로 익히기</p>
              </div>
            </Link>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="즐겨찾기에서 검색..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-12 h-12 rounded-xl bg-white border-border"
          />
        </div>

        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl mb-2">
              {isLoadingWords ? "즐겨찾기를 불러오는 중입니다" : "즐겨찾기가 비어 있습니다"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "단어 상세 화면에서 별표를 눌러 추가해보세요"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{filteredFavorites.length}개의 단어</p>
            </div>

            <div className="space-y-3">
              {filteredFavorites.map((item) => (
                <Link
                  key={item.id}
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
              ))}
            </div>
          </>
        )}

        <div className="mt-8 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-5 h-5 text-primary fill-primary/20" />
            <h3 className="text-xl">게시글</h3>
          </div>
          <p className="text-sm text-muted-foreground">커뮤니티에서 저장한 게시글만 모아서 볼 수 있어요.</p>
        </div>

        {savedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
            아직 저장한 게시글이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {savedPosts.map((post) => (
              <Link key={post.id} to={`/app/community/${post.id}`}>
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
            ))}
          </div>
        )}

        {favoriteWords.length > 0 && (
          <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
            <h3 className="mb-3">즐겨찾기 활용 팁</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>자주 헷갈리는 단어를 즐겨찾기에 추가하세요</li>
              <li>중요한 단어는 매일 한 번씩 다시 복습해보세요</li>
              <li>저장한 게시글도 함께 보며 학습 감각을 유지해보세요</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
