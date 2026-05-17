import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, BookOpen, Check, Star, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { isFavoriteWord, toggleFavoriteWord } from "../lib/favoriteWords";
import { getWordById, type WordDetailData, words } from "../lib/words";

const REVIEW_QUEUE_STORAGE_KEY = "review-queue-word-ids";

interface WordLocationState {
  word?: {
    id: string | number;
    word: string;
    meaning: string;
    level: string;
    mastery: number;
    isFavorite?: boolean;
  };
}

function createFallbackDetail(source: NonNullable<WordLocationState["word"]>): WordDetailData {
  const numericId = Number(source.id);

  return {
    id: Number.isNaN(numericId) ? -1 : numericId,
    word: source.word,
    meaning: source.meaning || "뜻 정보가 준비되지 않았습니다.",
    level: source.level || "전체",
    mastery: source.mastery ?? 0,
    isFavorite: source.isFavorite ?? false,
    pronunciation: `/${source.word}/`,
    examples: [
      {
        en: `${source.word} is part of your study list.`,
        ko: `${source.word} 단어가 학습 목록에 포함되어 있습니다.`,
      },
    ],
    synonyms: ["추가 정보 준비 중"],
    related: ["상세 데이터 연결 예정"],
  };
}

export default function WordDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const locationState = location.state as WordLocationState | null;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  const word = useMemo(() => {
    const numericId = Number(id);
    const byId = Number.isNaN(numericId) ? undefined : getWordById(numericId);

    if (byId) {
      return byId;
    }

    const wordName = searchParams.get("word");
    if (wordName) {
      const byName = words.find((item) => item.word.toLowerCase() === wordName.toLowerCase());
      if (byName) {
        return byName;
      }
    }

    if (locationState?.word) {
      return createFallbackDetail(locationState.word);
    }

    return undefined;
  }, [id, locationState, searchParams]);

  const favoriteWordId = useMemo(() => {
    if (!word) return "";
    if (id && id !== "-1") return id;
    return word.word;
  }, [id, word]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id, searchParams]);

  useEffect(() => {
    let isMounted = true;

    if (!word) {
      setIsFavorite(false);
      return () => {
        isMounted = false;
      };
    }

    setIsFavorite(word.isFavorite ?? false);

    if (!user || !favoriteWordId) {
      return () => {
        isMounted = false;
      };
    }

    void isFavoriteWord(user.uid, favoriteWordId)
      .then((result) => {
        if (!isMounted) return;
        setIsFavorite(result);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsFavorite(word.isFavorite ?? false);
      });

    return () => {
      isMounted = false;
    };
  }, [favoriteWordId, user, word]);

  const handleToggleFavorite = async () => {
    if (!word) return;

    if (!user) {
      toast.error("즐겨찾기는 로그인 후 이용할 수 있습니다.");
      return;
    }

    const nextFavorite = !isFavorite;
    setIsSavingFavorite(true);
    setIsFavorite(nextFavorite);

    try {
      await toggleFavoriteWord(
        user.uid,
        {
          id: favoriteWordId,
          word: word.word,
          meaning: word.meaning,
          level: word.level,
          mastery: word.mastery,
        },
        nextFavorite,
      );
      toast.success(nextFavorite ? "단어를 즐겨찾기에 추가했습니다." : "단어를 즐겨찾기에서 제거했습니다.");
    } catch (error) {
      console.error("즐겨찾기 처리에 실패했습니다.", error);
      setIsFavorite(!nextFavorite);
      toast.error("즐겨찾기 처리에 실패했습니다.");
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleStartReviewQuiz = () => {
    if (!word) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(REVIEW_QUEUE_STORAGE_KEY, JSON.stringify([word.word]));
    }

    navigate("/app/sentence-quiz?mode=review");
  };

  if (!word) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <Button variant="outline" onClick={() => navigate("/app/words")}>
          단어 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-white px-6 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleFavorite}
            disabled={isSavingFavorite}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center disabled:opacity-60"
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            <Star className={`w-5 h-5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-4xl mb-2">{word.word}</h1>
          <p className="text-white/80 mb-1">{word.pronunciation}</p>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {word.level}
          </Badge>
        </div>

        <button className="w-full bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center gap-2">
          <Volume2 className="w-5 h-5" />
          <span>발음 듣기</span>
        </button>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl p-5 border border-border mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>학습 진행도</span>
            </div>
            <span className="text-primary">{word.mastery}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${word.mastery}%` }} />
          </div>
        </div>

        <Tabs defaultValue="meaning" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="meaning">뜻</TabsTrigger>
            <TabsTrigger value="examples">예문</TabsTrigger>
            <TabsTrigger value="related">관련 단어</TabsTrigger>
          </TabsList>

          <TabsContent value="meaning" className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-border">
              <h3 className="text-sm text-muted-foreground mb-2">의미</h3>
              <p className="text-lg">{word.meaning}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border">
              <h3 className="text-sm text-muted-foreground mb-3">유의어</h3>
              <div className="flex flex-wrap gap-2">
                {word.synonyms.map((synonym) => (
                  <Badge key={synonym} variant="secondary" className="bg-accent">
                    {synonym}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            {word.examples.map((example, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <p className="flex-1">{example.en}</p>
                </div>
                <p className="text-muted-foreground pl-9">{example.ko}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="related" className="space-y-3">
            {word.related.map((relatedWord) => (
              <div
                key={relatedWord}
                className="bg-white rounded-2xl p-4 border border-border flex items-center justify-between"
              >
                <span>{relatedWord}</span>
                <Button variant="ghost" size="sm" className="text-primary">
                  보기
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-3">
          <Button
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl"
            onClick={handleStartReviewQuiz}
          >
            퀴즈로 복습하기
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl" onClick={handleToggleFavorite}>
            {isFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
          </Button>
        </div>
      </div>
    </div>
  );
}
