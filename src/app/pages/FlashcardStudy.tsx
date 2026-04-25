import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { X, RotateCcw, CheckCircle, XCircle, Trophy, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { shuffleArray } from "../lib/random";
import { recordCorrectAnswer, recordStudySessionCompletion, recordWrongAnswer } from "../lib/studyProgress";

interface Card {
  id: number;
  word: string;
  meaning: string;
  level: string;
  example?: string;
}

const initialCards: Card[] = [
  { id: 1, word: "Serendipity", meaning: "뜻밖의 행운", level: "고급", example: "Finding that book was pure serendipity." },
  { id: 2, word: "Abundant", meaning: "풍부한", level: "중급", example: "The garden has abundant flowers." },
  { id: 3, word: "Benevolent", meaning: "자비로운", level: "고급", example: "She is a benevolent leader." },
  { id: 4, word: "Compassion", meaning: "연민, 동정심", level: "중급", example: "He showed great compassion." },
  { id: 5, word: "Diligent", meaning: "근면한", level: "초급", example: "She is a diligent student." },
  { id: 6, word: "Eloquent", meaning: "웅변적인", level: "고급", example: "His speech was eloquent." },
  { id: 7, word: "Frugal", meaning: "검소한", level: "비즈니스", example: "They live a frugal lifestyle." },
  { id: 8, word: "Gregarious", meaning: "사교적인", level: "중급", example: "He has a gregarious personality." },
  { id: 9, word: "Harmonious", meaning: "조화로운", level: "비즈니스", example: "They have a harmonious relationship." },
];

export default function FlashcardStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [exitDirection, setExitDirection] = useState<"up" | "down" | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [completionRecorded, setCompletionRecorded] = useState(false);

  const selectedLevel = searchParams.get("level");
  const filteredCards =
    !selectedLevel || selectedLevel === "전체"
      ? initialCards
      : initialCards.filter((card) => card.level === selectedLevel);

  const totalCards = filteredCards.length;
  const progress = totalCards > 0 ? (correctCount / totalCards) * 100 : 0;

  useEffect(() => {
    const shuffled = shuffleArray(filteredCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0] ?? null);
    setIsFlipped(false);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(shuffled.length === 0);
    setExitDirection(null);
    setCompletionRecorded(false);
  }, [selectedLevel]);

  const nextCard = (nextRemainingCards: Card[]) => {
    setIsFlipped(false);
    setExitDirection(null);

    if (nextRemainingCards.length === 0) {
      setIsComplete(true);
      setCurrentCard(null);
      return;
    }

    const shuffled = shuffleArray(nextRemainingCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0] ?? null);
  };

  const handleKnow = () => {
    if (!currentCard) return;

    setExitDirection("up");
    setCorrectCount((prev) => prev + 1);
    recordCorrectAnswer({
      wordId: currentCard.id,
      word: currentCard.word,
      level: currentCard.level,
    });

    const nextRemainingCards = remainingCards.filter((card) => card.id !== currentCard.id);

    setTimeout(() => {
      nextCard(nextRemainingCards);
    }, 350);
  };

  const handleDontKnow = () => {
    if (!currentCard) return;

    setExitDirection("down");
    setWrongCount((prev) => prev + 1);
    recordWrongAnswer({
      wordId: currentCard.id,
      word: currentCard.word,
      level: currentCard.level,
    });

    const retryCards = remainingCards.filter((card) => card.id !== currentCard.id);
    const nextRemainingCards = [...retryCards, currentCard];

    setTimeout(() => {
      nextCard(nextRemainingCards);
    }, 350);
  };

  const handleFlip = () => {
    if (!isComplete) {
      setIsFlipped((prev) => !prev);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.y > threshold) {
      handleDontKnow();
    } else if (info.offset.y < -threshold) {
      handleKnow();
    }
  };

  const handleRestart = () => {
    const shuffled = shuffleArray(filteredCards);
    setRemainingCards(shuffled);
    setCurrentCard(shuffled[0] ?? null);
    setIsFlipped(false);
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(shuffled.length === 0);
    setExitDirection(null);
    setCompletionRecorded(false);
  };

  useEffect(() => {
    if (!isComplete || completionRecorded) {
      return;
    }

    recordStudySessionCompletion({
      correctCount,
      wrongCount,
    });
    setCompletionRecorded(true);
  }, [completionRecorded, correctCount, isComplete, wrongCount]);

  const toggleFavorite = (e: MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;

    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(currentCard.id)) {
        next.delete(currentCard.id);
      } else {
        next.add(currentCard.id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <div className="bg-white border-b border-border">
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

        <div className="px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/words")} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground">Shorts 학습</p>
            <p className="font-semibold">
              {selectedLevel && selectedLevel !== "전체" ? `${selectedLevel} 레벨` : "전체 레벨"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRestart} className="rounded-full">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 relative">
        <AnimatePresence mode="wait">
          {isComplete ? (
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
              <h2 className="text-3xl mb-3">학습 완료</h2>
              <p className="text-muted-foreground mb-6">
                {totalCards > 0 ? "선택한 레벨 단어 학습을 마쳤습니다." : "선택한 레벨에 맞는 카드가 없습니다."}
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
                    <p className="text-sm text-muted-foreground mb-1">총 시도 수</p>
                    <p className="text-2xl">{correctCount + wrongCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleRestart} size="lg" className="rounded-full">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  다시 학습하기
                </Button>
                <Button onClick={() => navigate("/app/words")} variant="outline" size="lg" className="rounded-full">
                  단어 목록으로
                </Button>
              </div>
            </motion.div>
          ) : currentCard ? (
            <div className="w-full max-w-md relative">
              <motion.div
                className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center"
                animate={{ opacity: isFlipped ? 1 : 0.3 }}
              >
                <div className="bg-green-100 rounded-full p-3 mb-2">
                  <ChevronUp className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-xs text-green-500">위로 밀면 알고 있는 단어</p>
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
                  transition: { duration: 0.35 },
                }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="absolute inset-0 bg-white rounded-3xl border-2 border-border shadow-xl flex flex-col items-center justify-center p-8"
                    style={{ backfaceVisibility: "hidden" }}
                  >
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

                    <p className="text-sm text-muted-foreground mb-4">{currentCard.level}</p>
                    <h2 className="text-5xl text-center mb-6">{currentCard.word}</h2>
                    <p className="text-sm text-muted-foreground">카드를 눌러 뜻 보기</p>
                  </div>

                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-3xl border-2 border-border shadow-xl flex flex-col items-center justify-center p-8 text-white"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
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

                    <p className="text-sm text-white/80 mb-4">{currentCard.level}</p>
                    <h2 className="text-4xl text-center mb-6">{currentCard.meaning}</h2>
                    {currentCard.example && (
                      <p className="text-sm text-white/80 text-center italic mt-4">"{currentCard.example}"</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center"
                animate={{ opacity: isFlipped ? 1 : 0.3 }}
              >
                <p className="text-xs text-red-500 mb-2">아래로 밀면 다시 볼 단어</p>
                <div className="bg-red-100 rounded-full p-3">
                  <ChevronDown className="w-6 h-6 text-red-500" />
                </div>
              </motion.div>

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

      {!isComplete && (
        <div className="bg-white border-t border-border px-6 py-4">
          <p className="text-xs text-center text-muted-foreground">
            카드를 뒤집어 뜻을 확인한 뒤, 위로 밀면 완료 처리되고 아래로 밀면 다시 출제됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
