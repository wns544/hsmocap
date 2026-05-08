import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { collection, documentId, getDocs, orderBy, query, where } from "firebase/firestore";
import { BookOpen, Bookmark, ChevronRight, MessageCircle, Search, Star, ThumbsUp, Zap } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { CommunityPostRecord, mapPostRecord } from "../lib/community";
import { db } from "../lib/firebase";

const text = {
  title: "즐겨찾기",
  subtitle: "자주 보는 단어와 저장한 게시글을 한곳에서 확인하세요.",
  favoriteWords: "즐겨찾기 단어",
  savedPosts: "저장한 게시글",
  searchPlaceholder: "즐겨찾기에서 검색...",
  emptyFavorites: "즐겨찾기가 비어 있습니다",
  emptySearch: "검색 결과가 없습니다.",
  emptySavedPosts: "아직 저장한 게시글이 없습니다.",
  postSectionTitle: "게시글",
  postSectionDescription: "커뮤니티에서 저장한 게시글만 모아서 볼 수 있어요.",
  flashcardTitle: "플래시카드",
  flashcardDescription: "즐겨찾기 단어 학습",
  sentenceTitle: "문장 학습",
  sentenceDescription: "문장으로 다시 익히기",
  tipTitle: "왜 즐겨찾기를 쓰나요?",
  tipOne: "자주 틀리는 단어를 먼저 저장해 두세요.",
  tipTwo: "중요한 게시글은 저장해 두고 나중에 다시 보세요.",
  tipThree: "저장한 게시글에서 학습 팁과 예문 아이디어를 다시 확인할 수 있습니다.",
};

const favoriteWords = [
  { id: 1, word: "Serendipity", meaning: "뜻밖의 행운", level: "고급", mastery: 85, addedDate: "2026-03-20" },
  { id: 2, word: "Eloquent", meaning: "웅변적인, 표현력이 좋은", level: "고급", mastery: 92, addedDate: "2026-03-22" },
  { id: 3, word: "Compassion", meaning: "연민, 공감", level: "중급", mastery: 88, addedDate: "2026-03-24" },
  { id: 4, word: "Harmonious", meaning: "조화로운", level: "초급", mastery: 95, addedDate: "2026-03-25" },
  { id: 5, word: "Abundant", meaning: "풍부한", level: "중급", mastery: 90, addedDate: "2026-03-26" },
];

function chunkIds(ids: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

export default function Favorites() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPosts, setSavedPosts] = useState<CommunityPostRecord[]>([]);

  useEffect(() => {
    if (!user) {
      setSavedPosts([]);
      return;
    }

    const loadSavedPosts = async () => {
      try {
        const favoritesQuery = query(
          collection(db, "users", user.uid, "favorite_posts"),
          orderBy("savedAt", "desc"),
        );
        const favoriteSnapshot = await getDocs(favoritesQuery);
        const postIds = favoriteSnapshot.docs.map((item) => item.id);

        if (postIds.length === 0) {
          setSavedPosts([]);
          return;
        }

        const postChunks = chunkIds(postIds, 10);
        const postSnapshots = await Promise.all(
          postChunks.map((ids) =>
            getDocs(query(collection(db, "posts"), where(documentId(), "in", ids))),
          ),
        );

        const postsById = new Map<string, CommunityPostRecord>();
        postSnapshots.forEach((snapshot) => {
          snapshot.docs.forEach((item) => {
            postsById.set(item.id, mapPostRecord(item.id, item.data()));
          });
        });

        setSavedPosts(postIds.map((postId) => postsById.get(postId)).filter((item): item is CommunityPostRecord => Boolean(item)));
      } catch (error) {
        console.error("Failed to load saved posts:", error);
        setSavedPosts([]);
      }
    };

    void loadSavedPosts();
  }, [user]);

  const filteredFavorites = useMemo(
    () =>
      favoriteWords.filter(
        (item) =>
          item.word.toLowerCase().includes(searchQuery.toLowerCase()) || item.meaning.includes(searchQuery),
      ),
    [searchQuery],
  );

  const filteredSavedPosts = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return savedPosts;
    }

    return savedPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(normalized) ||
        post.content.toLowerCase().includes(normalized) ||
        post.categoryName.toLowerCase().includes(normalized) ||
        post.author.name.toLowerCase().includes(normalized),
    );
  }, [savedPosts, searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-yellow-500 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl mb-1">{text.title}</h1>
            <p className="text-white/80">{text.subtitle}</p>
          </div>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl mb-1">{favoriteWords.length}</div>
              <div className="text-sm text-white/80">{text.favoriteWords}</div>
            </div>
            <div>
              <div className="text-2xl mb-1">{savedPosts.length}</div>
              <div className="text-sm text-white/80">{text.savedPosts}</div>
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
                  <h3 className="font-semibold">{text.flashcardTitle}</h3>
                </div>
                <p className="text-sm text-white/80">{text.flashcardDescription}</p>
              </div>
            </Link>

            <Link to="/app/sentence-favorites">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl p-5 active:scale-[0.98] transition-transform shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{text.sentenceTitle}</h3>
                </div>
                <p className="text-sm text-white/80">{text.sentenceDescription}</p>
              </div>
            </Link>
          </div>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={text.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-12 h-12 rounded-xl bg-white border-border"
          />
        </div>

        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl mb-2">{text.emptyFavorites}</h3>
            <p className="text-muted-foreground">{searchQuery ? text.emptySearch : "단어를 먼저 저장해 보세요."}</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{filteredFavorites.length}개의 단어</p>
            </div>

            <div className="space-y-3">
              {filteredFavorites.map((item) => (
                <Link key={item.id} to={`/app/words/${item.id}`}>
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
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item.addedDate).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          추가
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-5 h-5 text-primary fill-primary/20" />
                <h3 className="text-xl">{text.postSectionTitle}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{text.postSectionDescription}</p>
            </div>

            {filteredSavedPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
                {savedPosts.length === 0 ? text.emptySavedPosts : text.emptySearch}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSavedPosts.map((post) => (
                  <Link key={post.id} to={`/app/community/${post.id}`}>
                    <div className="bg-white rounded-2xl p-5 border border-border active:scale-[0.98] transition-transform">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-primary border-primary/30">
                              {post.categoryName}
                            </Badge>
                            {post.isHot && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                HOT
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-base mb-2">{post.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{post.author.name}</span>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{post.comments}</span>
                            </div>
                            <span>{post.timestamp}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {favoriteWords.length > 0 && (
          <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
            <h3 className="mb-3">{text.tipTitle}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{text.tipOne}</li>
              <li>{text.tipTwo}</li>
              <li>{text.tipThree}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
