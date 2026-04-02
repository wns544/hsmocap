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

const initialCards: Card[] = [
  { id: 1, word: "Serendipity", meaning: "뜻밖의 행운", example: "Finding that book was pure serendipity.", isFavorite: false },
  { id: 2, word: "Abundant", meaning: "풍부한", example: "The garden has abundant flowers.", isFavorite: false },
  { id: 3, word: "Benevolent", meaning: "자비로운", example: "She is a benevolent leader.", isFavorite: false },
  { id: 4, word: "Compassion", meaning: "연민, 동정심", example: "He showed great compassion.", isFavorite: false },
  { id: 5, word: "Diligent", meaning: "부지런한", example: "She is a diligent student.", isFavorite: false },
  { id: 6, word: "Eloquent", meaning: "웅변의", example: "His speech was eloquent.", isFavorite: false },
  { id: 7, word: "Frugal", meaning: "검소한", example: "They live a frugal lifestyle.", isFavorite: false },
  { id: 8, word: "Gregarious", meaning: "사교적인", example: "He has a gregarious personality.", isFavorite: false },
  { id: 9, word: "Harmonious", meaning: "조화로운", example: "They have a harmonious relationship.", isFavorite: false },
];

export default function FlashcardStudy() {
  const navigate = useNavigate();
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [exitDirection, setExitDirection] = useState<"up" | "down" | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // 카드 셔플 함수
  const shuffleCards = (cards: Card[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  };

  // 초기화
  useEffect(() => {
    const shuffled = shuffleCards(initialCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0]);
  }, []);

  // 다음 카드로 이동
  const nextCard = () => {
    setIsFlipped(false);
    setExitDirection(null);

    if (remainingCards.length === 0) {
      setIsComplete(true);
      setCurrentCard(null);
    } else {
      // 남은 카드가 1개 이상이면 다음 카드 표시
      const shuffled = shuffleCards(remainingCards);
      setRemainingCards(shuffled);
      setCurrentCard(shuffled[0]);
    }
  };

  // "알아요" (위로 스와이프)
  const handleKnow = () => {
    if (!currentCard) return;

    setExitDirection("up");
    const newCorrectCount = correctCount + 1;
    setCorrectCount(newCorrectCount);

    // 현재 카드를 제거
    const newRemaining = remainingCards.filter((card) => card.id !== currentCard.id);
    setRemainingCards(newRemaining);

    setTimeout(() => {
      // 정답 개수가 전체 카드 수 이상이면 완료
      if (newCorrectCount >= totalCards) {
        setIsComplete(true);
        setCurrentCard(null);
      } else if (newRemaining.length === 0) {
        setIsComplete(true);
        setCurrentCard(null);
      } else {
        nextCard();
      }
    }, 400);
  };

  // "모르겠어요" (아래로 스와이프)
  const handleDontKnow = () => {
    if (!currentCard) return;

    setExitDirection("down");
    setWrongCount(wrongCount + 1);

    // 현재 카드는 유지하고 셔플
    setTimeout(() => {
      nextCard();
    }, 400);
  };

  // 카드 뒤집기
  const handleFlip = () => {
    if (!isComplete) {
      setIsFlipped(!isFlipped);
    }
  };

  // 드래그 끝났을 때
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100; // 스와이프 임계값 (100px)

    if (info.offset.y > threshold) {
      // 아래로 스와이프 = 모르겠어요 (오답 처리 + 카드 유지)
      handleDontKnow();
    } else if (info.offset.y < -threshold) {
      // 위로 스와이프 = 알아요 (정답 처리 + 카드 소거)
      handleKnow();
    }
  };

  // 재시작
  const handleRestart = () => {
    const shuffled = shuffleCards(initialCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0]);
    setIsFlipped(false);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(false);
    setExitDirection(null);
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

  const totalCards = initialCards.length;
  const progress = (correctCount / totalCards) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header with Progress */}
      <div className="bg-white border-b border-border">
        {/* Progress Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Header Content */}
        <div className="px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/home")}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">플래시카드 학습</p>
            <p className="font-semibold">
              {isComplete ? "완료!" : `${correctCount} / ${totalCards}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            className="rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 relative">
        <AnimatePresence mode="wait">
          {isComplete ? (
            // 완료 화면
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl mb-3">학습 완료! 🎉</h2>
              <p className="text-muted-foreground mb-6">
                모든 단어를 마스터했습니다!
              </p>

              <div className="bg-white rounded-2xl p-6 border border-border max-w-sm mx-auto mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">정답</p>
                    <p className="text-2xl text-green-500">{correctCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">오답</p>
                    <p className="text-2xl text-red-500">{wrongCount}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">총 학습 횟수</p>
                    <p className="text-2xl">{correctCount + wrongCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleRestart}
                  size="lg"
                  className="rounded-full"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  다시 학습하기
                </Button>
                <Button
                  onClick={() => navigate("/app/home")}
                  variant="outline"
                  size="lg"
                  className="rounded-full"
                >
                  홈으로
                </Button>
              </div>
            </motion.div>
          ) : currentCard ? (
            // 플래시카드
            <div className="w-full max-w-md relative">
              {/* Swipe Indicators */}
              <motion.div
                className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center"
                animate={{ opacity: isFlipped ? 1 : 0.3 }}
              >
                <div className="bg-green-100 rounded-full p-3 mb-2">
                  <ChevronUp className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-xs text-green-500">위로 밀어서 알아요</p>
              </motion.div>

              <motion.div
                key={currentCard.id}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.3}
                onDragEnd={handleDragEnd}
                className="relative h-96 cursor-pointer"
                whileDrag={{ scale: 1.05 }}
                onClick={handleFlip}
                exit={{
                  y: exitDirection === "down" ? 800 : exitDirection === "up" ? -800 : 0,
                  opacity: 0,
                  transition: { duration: 0.4 }
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* 앞면 (단어) */}
                  <div
                    className="absolute inset-0 bg-white rounded-3xl border-2 border-border shadow-xl flex flex-col items-center justify-center p-8"
                    style={{
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={toggleFavorite}
                      className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors z-10"
                    >
                      {favorites.has(currentCard.id) ? (
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                    
                    <p className="text-sm text-muted-foreground mb-4">단어</p>
                    <h2 className="text-5xl text-center mb-6">{currentCard.word}</h2>
                    <p className="text-sm text-muted-foreground">탭하여 뜻 보기</p>
                  </div>

                  {/* 뒷면 (뜻) */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-3xl border-2 border-border shadow-xl flex flex-col items-center justify-center p-8 text-white"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {/* 즐겨찾기 버튼 (뒷면) */}
                    <button
                      onClick={toggleFavorite}
                      className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      {favorites.has(currentCard.id) ? (
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Star className="w-6 h-6 text-white/80" />
                      )}
                    </button>
                    
                    <p className="text-sm text-white/80 mb-4">뜻</p>
                    <h2 className="text-4xl text-center mb-6">{currentCard.meaning}</h2>
                    {currentCard.example && (
                      <p className="text-sm text-white/80 text-center italic mt-4">
                        "{currentCard.example}"
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center"
                animate={{ opacity: isFlipped ? 1 : 0.3 }}
              >
                <p className="text-xs text-red-500 mb-2">아래로 밀어서 모르겠어요</p>
                <div className="bg-red-100 rounded-full p-3">
                  <ChevronDown className="w-6 h-6 text-red-500" />
                </div>
              </motion.div>

              {/* Stats */}
              <div className="absolute -bottom-32 left-0 right-0 flex justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>정답: {correctCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>오답: {wrongCount}</span>
                </div>
              </div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {!isComplete && (
        <div className="bg-white border-t border-border px-6 py-4">
          <p className="text-xs text-center text-muted-foreground">
            💡 탭하여 뜻 확인 • 위로 스와이프 = 알아요 (소거) • 아래로 스와이프 = 모르겠어요 (반복)
          </p>
        </div>
      )}
    </div>
  );
}