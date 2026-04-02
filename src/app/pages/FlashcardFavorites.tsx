import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, RotateCcw, CheckCircle, XCircle, Trophy, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence, PanInfo } from "motion/react";

interface Card {
  id: number;
  word: string;
  meaning: string;
  example?: string;
  isFavorite?: boolean;
}

// 즐겨찾기 단어들만
const favoriteCards: Card[] = [
  { id: 1, word: "Serendipity", meaning: "뜻밖의 행운", example: "Finding that book was pure serendipity.", isFavorite: true },
  { id: 2, word: "Eloquent", meaning: "웅변의, 설득력 있는", example: "His speech was eloquent.", isFavorite: true },
  { id: 3, word: "Compassion", meaning: "연민, 동정심", example: "He showed great compassion.", isFavorite: true },
  { id: 4, word: "Harmonious", meaning: "조화로운", example: "They have a harmonious relationship.", isFavorite: true },
  { id: 5, word: "Abundant", meaning: "풍부한", example: "The garden has abundant flowers.", isFavorite: true },
];

export default function FlashcardFavorites() {
  const navigate = useNavigate();
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [exitDirection, setExitDirection] = useState<"up" | "down" | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set(favoriteCards.map(c => c.id)));

  // 카드 셔플 함수
  const shuffleCards = (cards: Card[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  };

  // 초기화
  useEffect(() => {
    const shuffled = shuffleCards(favoriteCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0]);
  }, []);

  // 다음 카드로 이동
  const handleNext = (direction: "up" | "down") => {
    setExitDirection(direction);
    
    setTimeout(() => {
      if (remainingCards.length > 1) {
        const newRemaining = remainingCards.slice(1);
        setRemainingCards(newRemaining);
        setCurrentCard(newRemaining[0]);
        setIsFlipped(false);
        setExitDirection(null);
      } else {
        setIsComplete(true);
      }
    }, 300);
  };

  // 알아요 (위로 스와이프)
  const handleKnow = () => {
    setCorrectCount(correctCount + 1);
    handleNext("up");
  };

  // 모르겠어요 (아래로 스와이프)
  const handleDontKnow = () => {
    setWrongCount(wrongCount + 1);
    handleNext("down");
  };

  // 카드 뒤집기
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // 다시 시작
  const handleRestart = () => {
    const shuffled = shuffleCards(favoriteCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0]);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(false);
    setIsFlipped(false);
  };

  // 드래그 엔드 핸들러
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.y < -threshold) {
      // 위로 스와이프 - 알아요
      handleKnow();
    } else if (info.offset.y > threshold) {
      // 아래로 스와이프 - 모르겠어요
      handleDontKnow();
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 뒤집기 방지
    if (!currentCard) return;
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(currentCard.id)) {
        newFavorites.delete(currentCard.id);
      } else {
        newFavorites.add(currentCard.id);
      }
      return newFavorites;
    });
  };

  const totalCards = favoriteCards.length;
  const completedCards = correctCount + wrongCount;
  const progress = (completedCards / totalCards) * 100;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Trophy */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-8 shadow-2xl">
              <Trophy className="w-20 h-20 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
            즐겨찾기 학습 완료!
          </h1>
          <p className="text-center text-gray-600 mb-8">
            ⭐ 즐겨찾기 단어를 모두 학습했습니다!
          </p>

          {/* Stats Card */}
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
                <span className="text-2xl font-bold text-green-600">
                  {totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0}%
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${totalCards > 0 ? (correctCount / totalCards) * 100 : 0}%` 
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
      {/* Header */}
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
            <span className="text-white text-sm font-bold">
              ⭐ {completedCards}/{totalCards}
            </span>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Instructions */}
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

        {/* Flashcard */}
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
                  rotateY: isFlipped ? 180 : 0
                }}
                exit={{
                  opacity: 0,
                  y: exitDirection === "up" ? -300 : 300,
                  scale: 0.8,
                  transition: { duration: 0.3 }
                }}
                transition={{ duration: 0.5 }}
                onClick={handleFlip}
                className="w-full h-full cursor-pointer relative preserve-3d"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front Side */}
                <div
                  className="absolute inset-0 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <div className="w-full h-full bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center border border-border relative">
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={toggleFavorite}
                      className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          favorites.has(currentCard.id)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>

                    <div className="mb-6 px-4 py-2 bg-yellow-100 rounded-full">
                      <span className="text-xs text-yellow-800 font-semibold">앞면</span>
                    </div>
                    <h2 className="text-5xl font-bold text-gray-800 mb-4 text-center">
                      {currentCard.word}
                    </h2>
                    <p className="text-gray-500 text-center">카드를 탭해서 뒤집기</p>
                  </div>
                </div>

                {/* Back Side */}
                <div
                  className="absolute inset-0 backface-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: isFlipped ? "rotateY(0deg)" : "rotateY(180deg)",
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-white relative">
                    {/* 즐겨찾기 버튼 (뒷면) */}
                    <button
                      onClick={toggleFavorite}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          favorites.has(currentCard.id)
                            ? "fill-white text-white"
                            : "text-white/60"
                        }`}
                      />
                    </button>

                    <div className="mb-6 px-4 py-2 bg-white/20 rounded-full">
                      <span className="text-xs font-semibold">뒷면</span>
                    </div>
                    <h3 className="text-4xl font-bold mb-6 text-center">
                      {currentCard.meaning}
                    </h3>
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

        {/* Action Buttons */}
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

        {/* Stats */}
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
