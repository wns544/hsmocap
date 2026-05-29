import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { X, RotateCcw, CheckCircle, XCircle, Trophy, ChevronDown, ChevronUp, Star } from "lucide-react";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { listFavoriteWords, type FavoriteWordItem } from "../lib/favoriteWords";
import { words as wordDetails } from "../lib/words";

interface Card {
  id: string;
  word: string;
  meaning: string;
  example?: string;
}

function shuffleCards(cards: Card[]) {
  return [...cards].sort(() => Math.random() - 0.5);
}

function toFlashcard(word: FavoriteWordItem): Card {
  const detail = wordDetails.find((item) => item.word.toLowerCase() === word.word.toLowerCase());

  return {
    id: word.id,
    word: word.word,
    meaning: word.meaning,
    example: detail?.examples[0]?.en,
  };
}

export default function FlashcardFavorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favoriteCards, setFavoriteCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [exitDirection, setExitDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFavoriteCards = async () => {
      if (!user) {
        if (!isMounted) return;
        setFavoriteCards([]);
        setRemainingCards([]);
        setCurrentCard(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const items = await listFavoriteWords(user.uid);
        if (!isMounted) return;

        const cards = items.map(toFlashcard);
        const shuffled = shuffleCards(cards);

        setFavoriteCards(cards);
        setRemainingCards(shuffled);
        setCurrentCard(shuffled[0] ?? null);
        setCorrectCount(0);
        setWrongCount(0);
        setIsComplete(false);
        setIsFlipped(false);
      } catch (error) {
        console.error("즐겨찾기 플래시카드를 불러오지 못했습니다.", error);
        if (!isMounted) return;
        setFavoriteCards([]);
        setRemainingCards([]);
        setCurrentCard(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadFavoriteCards();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const totalCards = favoriteCards.length;
  const completedCards = correctCount + wrongCount;
  const progress = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;
  const hasCards = totalCards > 0;

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleNext = (direction: "up" | "down") => {
    setExitDirection(direction);

    window.setTimeout(() => {
      if (remainingCards.length > 1) {
        const newRemaining = remainingCards.slice(1);
        setRemainingCards(newRemaining);
        setCurrentCard(newRemaining[0] ?? null);
        setIsFlipped(false);
        setExitDirection(null);
      } else {
        setIsComplete(true);
        setExitDirection(null);
      }
    }, 300);
  };

  const handleKnow = () => {
    setCorrectCount((prev) => prev + 1);
    handleNext("up");
  };

  const handleDontKnow = () => {
    setWrongCount((prev) => prev + 1);
    handleNext("down");
  };

  const handleRestart = () => {
    const shuffled = shuffleCards(favoriteCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0] ?? null);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(false);
    setIsFlipped(false);
    setExitDirection(null);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;

    if (info.offset.y < -threshold) {
      handleKnow();
    } else if (info.offset.y > threshold) {
      handleDontKnow();
    }
  };

  const statsSummary = useMemo(
    () => (totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0),
    [correctCount, totalCards],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-2">즐겨찾기 단어를 불러오는 중입니다.</p>
          <p className="text-sm text-gray-500">플래시카드 학습을 준비하고 있어요.</p>
        </div>
      </div>
    );
  }

  if (!hasCards) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center bg-white rounded-3xl shadow-xl p-8 border border-border">
          <Star className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl text-gray-800 mb-2">즐겨찾기 단어가 없습니다</h1>
          <p className="text-sm text-gray-500 mb-6">단어 상세 화면에서 별표를 눌러 즐겨찾기를 추가해 주세요.</p>
          <Button onClick={() => navigate("/app/favorites")} className="rounded-2xl">
            즐겨찾기로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-8 shadow-2xl">
              <Trophy className="w-20 h-20 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">즐겨찾기 학습 완료!</h1>
          <p className="text-center text-gray-600 mb-8">즐겨찾기에 담은 단어를 모두 학습했어요.</p>

          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">{totalCards}</div>
                <div className="text-sm text-gray-500">총 단어</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{correctCount}</div>
                <div className="text-sm text-gray-500">알아요</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-1">{wrongCount}</div>
                <div className="text-sm text-gray-500">모르겠어요</div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-semibold">숙련도</span>
                <span className="text-2xl font-bold text-green-600">{statsSummary}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${statsSummary}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleRestart}
              size="lg"
              variant="outline"
              className="h-14 rounded-2xl text-base font-semibold"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              다시 학습
            </Button>
            <Button
              onClick={() => navigate("/app/favorites")}
              size="lg"
              className="h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
            >
              즐겨찾기로
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/app/favorites")}
          className="rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3 flex-1 mx-4">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full px-3 py-1">
            <span className="text-white text-sm font-bold">⭐ {completedCards}/{totalCards}</span>
          </div>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRestart}
          className="rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="mb-8 text-center">
          <p className="text-gray-600 mb-2">카드를 탭해서 뒤집거나</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ChevronUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">위로 스와이프 = 알아요</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600">아래로 = 모르겠어요</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md h-96 perspective-1000 relative">
          <AnimatePresence mode="wait">
            {currentCard && !exitDirection && (
              <motion.div
                key={currentCard.id}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.7}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.8, rotateY: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateY: isFlipped ? 180 : 0,
                }}
                exit={{
                  opacity: 0,
                  y: exitDirection === "up" ? -300 : 300,
                  scale: 0.8,
                  transition: { duration: 0.3 },
                }}
                transition={{ duration: 0.5 }}
                onClick={handleFlip}
                className="w-full h-full cursor-pointer relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(0deg)",
                  }}
                >
                  <div className="w-full h-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center border border-border relative">
                    <div className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 z-10">
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    </div>

                    <div className="mb-6 px-4 py-2 bg-yellow-100 rounded-full">
                      <span className="text-xs text-yellow-800 font-semibold">앞면</span>
                    </div>
                    <h2 className="text-5xl font-bold text-gray-800 mb-4 text-center">{currentCard.word}</h2>
                    <p className="text-gray-500 text-center">카드를 탭해서 뒤집기</p>
                  </div>
                </div>

                <div
                  className="absolute inset-0 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-white relative">
                    <div className="absolute top-4 right-4 p-2 rounded-full bg-white/20 z-10">
                      <Star className="w-6 h-6 fill-white text-white" />
                    </div>

                    <div className="mb-6 px-4 py-2 bg-white/20 rounded-full">
                      <span className="text-xs font-semibold">뒷면</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-6 text-center">{currentCard.meaning}</h3>
                    {currentCard.example && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-4">
                        <p className="text-sm italic text-center">{currentCard.example}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <button
            onClick={handleDontKnow}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          >
            <XCircle className="w-10 h-10" />
          </button>

          <button
            onClick={handleFlip}
            className="text-sm text-gray-600 px-6 py-3 bg-white rounded-full shadow hover:shadow-md transition-shadow"
          >
            카드 뒤집기
          </button>

          <button
            onClick={handleKnow}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10" />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-600">알아요: {correctCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-orange-500" />
            <span className="text-gray-600">모르겠어요: {wrongCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
