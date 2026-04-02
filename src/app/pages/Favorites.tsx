import { Link } from "react-router";
import { Star, ChevronRight, Search, Zap, BookOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState("");

  const favorites = [
    {
      id: 1,
      word: "Serendipity",
      meaning: "뜻밖의 행운",
      level: "고급",
      mastery: 85,
      addedDate: "2026-03-20",
    },
    {
      id: 2,
      word: "Eloquent",
      meaning: "웅변의, 설득력 있는",
      level: "고급",
      mastery: 92,
      addedDate: "2026-03-22",
    },
    {
      id: 3,
      word: "Compassion",
      meaning: "연민, 동정심",
      level: "중급",
      mastery: 88,
      addedDate: "2026-03-24",
    },
    {
      id: 4,
      word: "Harmonious",
      meaning: "조화로운",
      level: "초급",
      mastery: 95,
      addedDate: "2026-03-25",
    },
    {
      id: 5,
      word: "Abundant",
      meaning: "풍부한",
      level: "중급",
      mastery: 90,
      addedDate: "2026-03-26",
    },
  ];

  const filteredFavorites = favorites.filter((item) =>
    item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.meaning.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-yellow-500 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl mb-1">즐겨찾기</h1>
            <p className="text-white/80">자주 보는 단어를 모아보세요</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl mb-1">{favorites.length}</div>
              <div className="text-sm text-white/80">즐겨찾기한 단어</div>
            </div>
            <div>
              <div className="text-2xl mb-1">
                {Math.round(
                  favorites.reduce((sum, item) => sum + item.mastery, 0) / favorites.length
                )}
                %
              </div>
              <div className="text-sm text-white/80">평균 학습률</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {/* Study Buttons - 즐겨찾기 학습 버튼 */}
        {favorites.length > 0 && (
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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="즐겨찾기에서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-white border-border"
          />
        </div>

        {/* Favorites List */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl mb-2">즐겨찾기가 비어있습니다</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "검색 결과가 없습니다"
                : "단어를 즐겨찾기에 추가해보세요"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredFavorites.length}개의 단어
              </p>
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
                              <div
                                className="h-full bg-yellow-500 rounded-full"
                                style={{ width: `${item.mastery}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {item.mastery}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(item.addedDate).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          에 추가
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Tips */}
        {favorites.length > 0 && (
          <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
            <h3 className="mb-3">⭐ 즐겨찾기 활용 팁</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 자주 헷갈리는 단어를 즐겨찾기에 추가하세요</li>
              <li>• 중요한 단어는 매일 한 번씩 복습하세요</li>
              <li>• 단어장처럼 활용해 시험 전 빠르게 복습할 수 있어요</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}