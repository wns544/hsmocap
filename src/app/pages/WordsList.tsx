import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, Filter, ChevronRight, Star, BookOpen, Layers, TrendingUp } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { db } from "../lib/firebase";
import { fallbackWordSummaries } from "../lib/words";

interface WordItem {
  id: string;
  word: string;
  meaning: string;
  level: string;
  mastery: number;
  isFavorite: boolean;
}

const fallbackWords: WordItem[] = fallbackWordSummaries.map((word) => ({
  id: String(word.id),
  word: word.word,
  meaning: word.meaning,
  level: word.level,
  mastery: word.mastery,
  isFavorite: word.isFavorite,
}));

const categories = ["전체", "초급", "중급", "고급", "비즈니스"] as const;

export default function WordsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [words, setWords] = useState<WordItem[]>(fallbackWords);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("전체");

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

    return word.word.toLowerCase().includes(keyword) || word.meaning.toLowerCase().includes(keyword);
  });

  const filteredWords =
    activeCategory === "전체"
      ? searchedWords
      : searchedWords.filter((word) => word.level === activeCategory);

  const buildStudyPath = (path: string) =>
    activeCategory === "전체" ? path : `${path}?level=${encodeURIComponent(activeCategory)}`;

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-white border-b border-border px-6 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="text-3xl mb-4">단어 학습</h1>

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

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full flex-shrink-0 ${
                activeCategory === category ? "bg-primary text-white" : "bg-white hover:bg-muted"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            onClick={() => navigate(buildStudyPath("/app/sentence-quiz"))}
            className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-2xl"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-sm font-medium">학습하기</span>
          </Button>

          <Button
            onClick={() => navigate(buildStudyPath("/app/flashcard-study"))}
            className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 rounded-2xl"
          >
            <Layers className="w-6 h-6" />
            <span className="text-sm font-medium">Shorts</span>
          </Button>

          <Button
            onClick={() => navigate(buildStudyPath("/app/review"))}
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
            <Link
              key={item.id}
              to={`/app/words/${item.id}?word=${encodeURIComponent(item.word)}`}
              state={{ word: item }}
            >
              <div className="bg-white rounded-2xl p-4 border border-border active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg">{item.word}</h3>
                      {item.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                    <p className="text-muted-foreground mb-3">{item.meaning}</p>
                    <div className="flex items-center">
                      <Badge variant="secondary" className="text-xs">
                        {item.level}
                      </Badge>
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
