import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Filter, ChevronRight, Star, BookOpen, Layers, TrendingUp } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { db } from "../lib/firebase";

interface WordItem {
  id: string;
  word: string;
  meaning: string;
  level: string;
  mastery: number;
  isFavorite: boolean;
}

const fallbackWords: WordItem[] = [
  { id: "1", word: "Serendipity", meaning: "뜻밖의 행운", level: "고급", mastery: 78, isFavorite: true },
  { id: "2", word: "Abundant", meaning: "풍부한", level: "중급", mastery: 85, isFavorite: true },
  { id: "3", word: "Benevolent", meaning: "자비로운", level: "고급", mastery: 72, isFavorite: false },
  { id: "4", word: "Compassion", meaning: "연민, 동정심", level: "중급", mastery: 90, isFavorite: true },
  { id: "5", word: "Diligent", meaning: "부지런한", level: "초급", mastery: 95, isFavorite: false },
  { id: "6", word: "Eloquent", meaning: "웅변의", level: "고급", mastery: 68, isFavorite: true },
  { id: "7", word: "Frugal", meaning: "검소한", level: "중급", mastery: 80, isFavorite: false },
  { id: "8", word: "Gregarious", meaning: "사교적인", level: "고급", mastery: 55, isFavorite: false },
  { id: "9", word: "Harmonious", meaning: "조화로운", level: "초급", mastery: 92, isFavorite: true },
  { id: "10", word: "Simple", meaning: "간단한", level: "초급", mastery: 100, isFavorite: false },
  { id: "11", word: "Happy", meaning: "행복한", level: "초급", mastery: 98, isFavorite: true },
  { id: "12", word: "Leverage", meaning: "활용하다", level: "비즈니스", mastery: 65, isFavorite: false },
  { id: "13", word: "Synergy", meaning: "시너지", level: "비즈니스", mastery: 70, isFavorite: true },
  { id: "14", word: "Stakeholder", meaning: "이해관계자", level: "비즈니스", mastery: 82, isFavorite: false },
  { id: "15", word: "Quarterly", meaning: "분기별", level: "비즈니스", mastery: 88, isFavorite: true },
  { id: "16", word: "Revenue", meaning: "수익", level: "비즈니스", mastery: 75, isFavorite: false },
];

export default function WordsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [words, setWords] = useState<WordItem[]>(fallbackWords);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["전체", "초급", "중급", "고급", "비즈니스"];
  const [activeCategory, setActiveCategory] = useState("전체");

  useEffect(() => {
    const loadWords = async () => {
      try {
        const wordsQuery = query(collection(db, "words"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(wordsQuery);

        if (!snapshot.empty) {
          const firestoreWords = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              word: typeof data.word === "string" ? data.word : "Untitled",
              meaning: typeof data.meaning === "string" ? data.meaning : "",
              level: typeof data.level === "string" ? data.level : "전체",
              mastery: typeof data.mastery === "number" ? data.mastery : 0,
              isFavorite: Boolean(data.isFavorite),
            } satisfies WordItem;
          });

          setWords(firestoreWords);
        }
      } catch (error) {
        console.error("단어 목록 불러오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadWords();
  }, []);

  const searchedWords = words.filter((word) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return (
      word.word.toLowerCase().includes(keyword) ||
      word.meaning.toLowerCase().includes(keyword)
    );
  });

  const filteredWords =
    activeCategory === "전체"
      ? searchedWords
      : searchedWords.filter((word) => word.level === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="text-3xl mb-4">단어 학습</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="단어 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-12 rounded-xl bg-input-background"
          />
          <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full flex-shrink-0 ${
                activeCategory === category
                  ? "bg-primary text-white"
                  : "bg-white hover:bg-muted"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Words List */}
      <div className="px-6 mt-4">
        {/* Study Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            onClick={() => navigate("/app/sentence-quiz")}
            className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-2xl"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-sm font-medium">학습하기</span>
          </Button>
          
          <Button
            onClick={() => navigate("/app/flashcard-study")}
            className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 rounded-2xl"
          >
            <Layers className="w-6 h-6" />
            <span className="text-sm font-medium">Shorts</span>
          </Button>
          
          <Button
            onClick={() => navigate("/app/review")}
            className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 rounded-2xl"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm font-medium">복습하기</span>
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "불러오는 중..." : `${filteredWords.length}개의 단어`}
          </p>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            오늘 15개 추가
          </Badge>
        </div>

        <div className="space-y-3">
          {filteredWords.map((item) => (
            <Link key={item.id} to={`/app/words/${item.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-border active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg">{item.word}</h3>
                      {item.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{item.meaning}</p>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {item.level}
                      </Badge>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${item.mastery}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.mastery}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
