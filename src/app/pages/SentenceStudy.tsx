import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, RotateCcw, CheckCircle, XCircle, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "motion/react";

interface Question {
  id: number;
  sentence: string;
  highlightWord: string;
  correctAnswer: string;
  wrongAnswers: string[];
  explanation?: string;
}

const initialQuestions: Question[] = [
  {
    id: 1,
    sentence: "I ate the pizza.",
    highlightWord: "ate",
    correctAnswer: "먹었다",
    wrongAnswers: ["마셨다", "샀다", "만들었다"],
    explanation: "ate는 eat(먹다)의 과거형입니다.",
  },
  {
    id: 2,
    sentence: "She quickly ran to the store.",
    highlightWord: "quickly",
    correctAnswer: "빠르게",
    wrongAnswers: ["천천히", "조용히", "갑자기"],
    explanation: "quickly는 '빠르게, 신속하게'라는 뜻의 부사입니다.",
  },
  {
    id: 3,
    sentence: "The weather is beautiful today.",
    highlightWord: "beautiful",
    correctAnswer: "아름다운",
    wrongAnswers: ["추운", "더운", "흐린"],
    explanation: "beautiful은 '아름다운, 멋진'이라는 뜻입니다.",
  },
  {
    id: 4,
    sentence: "He studies English every day.",
    highlightWord: "studies",
    correctAnswer: "공부하다",
    wrongAnswers: ["가르치다", "읽다", "쓰다"],
    explanation: "studies는 study(공부하다)의 3인칭 단수 현재형입니다.",
  },
  {
    id: 5,
    sentence: "They arrived at the airport early.",
    highlightWord: "arrived",
    correctAnswer: "도착했다",
    wrongAnswers: ["떠났다", "지나갔다", "기다렸다"],
    explanation: "arrived는 arrive(도착하다)의 과거형입니다.",
  },
  {
    id: 6,
    sentence: "The book was very interesting.",
    highlightWord: "interesting",
    correctAnswer: "흥미로운",
    wrongAnswers: ["지루한", "어려운", "쉬운"],
    explanation: "interesting은 '흥미로운, 재미있는'이라는 뜻입니다.",
  },
  {
    id: 7,
    sentence: "She always wakes up at 6 AM.",
    highlightWord: "wakes",
    correctAnswer: "깨다",
    wrongAnswers: ["자다", "먹다", "일하다"],
    explanation: "wakes는 wake(깨다, 일어나다)의 3인칭 단수 현재형입니다.",
  },
  {
    id: 8,
    sentence: "I need to buy some groceries.",
    highlightWord: "groceries",
    correctAnswer: "식료품",
    wrongAnswers: ["옷", "책", "가구"],
    explanation: "groceries는 '식료품'을 의미합니다.",
  },
];

export default function SentenceStudy() {
  const navigate = useNavigate();
  const [remainingQuestions, setRemainingQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // 배열 셔플 함수
  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // 초기화 및 새 문제 설정
  const setupNewQuestion = (questions: Question[]) => {
    if (questions.length === 0) {
      setIsComplete(true);
      setCurrentQuestion(null);
      return;
    }

    const shuffled = shuffleArray(questions);
    const question = shuffled[0];
    
    // 선택지 셔플
    const choices = shuffleArray([
      question.correctAnswer,
      ...question.wrongAnswers,
    ]);

    setRemainingQuestions(shuffled);
    setCurrentQuestion(question);
    setShuffledChoices(choices);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
  };

  // 초기화
  useEffect(() => {
    setupNewQuestion(shuffleArray(initialQuestions));
  }, []);

  // 답변 선택
  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return; // 이미 선택했으면 무시

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct) {
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }
  };

  // 다음 문제로
  const handleNext = () => {
    if (!currentQuestion) return;

    if (isCorrect) {
      // 정답이면 해당 문제 제거
      const newRemaining = remainingQuestions.filter(
        (q) => q.id !== currentQuestion.id
      );
      setupNewQuestion(newRemaining);
    } else {
      // 오답이면 문제 유지하고 셔플
      setupNewQuestion(remainingQuestions);
    }
  };

  // 재시작
  const handleRestart = () => {
    setupNewQuestion(shuffleArray(initialQuestions));
    setCorrectCount(0);
    setWrongCount(0);
    setIsComplete(false);
  };

  // 문장에서 특정 단어 하이라이트
  const renderHighlightedSentence = () => {
    if (!currentQuestion) return null;

    const { sentence, highlightWord } = currentQuestion;
    const parts = sentence.split(new RegExp(`(\\b${highlightWord}\\b)`, "gi"));

    return (
      <p className="text-2xl leading-relaxed">
        {parts.map((part, index) => {
          if (part.toLowerCase() === highlightWord.toLowerCase()) {
            return (
              <span key={index} className="text-green-500 font-bold">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
    );
  };

  const totalQuestions = initialQuestions.length;
  const progress =
    ((totalQuestions - remainingQuestions.length) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col">
      {/* Header with Progress */}
      <div className="bg-white border-b border-border">
        {/* Progress Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500"
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
            <p className="text-sm text-muted-foreground">문장 속 단어 학습</p>
            <p className="font-semibold">
              {isComplete
                ? "완료!"
                : `${totalQuestions - remainingQuestions.length} / ${totalQuestions}`}
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
      <div className="flex-1 flex items-center justify-center px-6 py-8">
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
                모든 문제를 마스터했습니다!
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
                    <p className="text-sm text-muted-foreground mb-1">
                      총 학습 횟수
                    </p>
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
          ) : currentQuestion ? (
            // 문제 화면
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
            >
              {/* 문장 카드 */}
              <div className="bg-white rounded-3xl border-2 border-border shadow-xl p-8 mb-6">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  초록색 단어의 뜻을 고르세요
                </p>
                <div className="text-center mb-6">
                  {renderHighlightedSentence()}
                </div>

                {/* 피드백 */}
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`mt-6 p-4 rounded-2xl border-2 ${
                      isCorrect
                        ? "bg-green-50 border-green-500"
                        : "bg-red-50 border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <p
                        className={`font-semibold ${
                          isCorrect ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isCorrect ? "정답입니다!" : "틀렸습니다!"}
                      </p>
                    </div>
                    {!isCorrect && (
                      <p className="text-sm text-red-700 mb-2">
                        정답: <strong>{currentQuestion.correctAnswer}</strong>
                      </p>
                    )}
                    {currentQuestion.explanation && (
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* 선택지 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {shuffledChoices.map((choice, index) => {
                  const isSelected = selectedAnswer === choice;
                  const isCorrectChoice = choice === currentQuestion.correctAnswer;
                  const showResult = selectedAnswer !== null;

                  let buttonStyle = "bg-white border-2 border-border hover:border-primary";

                  if (showResult) {
                    if (isSelected && isCorrect) {
                      buttonStyle = "bg-green-100 border-2 border-green-500";
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = "bg-red-100 border-2 border-red-500";
                    } else if (isCorrectChoice) {
                      buttonStyle = "bg-green-50 border-2 border-green-300";
                    } else {
                      buttonStyle = "bg-gray-50 border-2 border-gray-200 opacity-50";
                    }
                  }

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectAnswer(choice)}
                      disabled={selectedAnswer !== null}
                      className={`p-6 rounded-2xl transition-all ${buttonStyle} disabled:cursor-not-allowed`}
                      whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                      whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                    >
                      <p className="text-xl">{choice}</p>
                    </motion.button>
                  );
                })}
              </div>

              {/* 다음 버튼 */}
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="rounded-full px-12"
                  >
                    다음 문제
                  </Button>
                </motion.div>
              )}

              {/* 통계 */}
              <div className="flex justify-center gap-8 mt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>정답: {correctCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>오답: {wrongCount}</span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
