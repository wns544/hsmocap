import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

export default function MultipleChoiceQuiz() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      word: "Serendipity",
      question: "이 단어의 뜻은?",
      options: ["뜻밖의 행운", "슬픈 감정", "빠른 속도", "작은 크기"],
      correctAnswer: 0,
    },
    {
      word: "Eloquent",
      question: "이 단어의 뜻은?",
      options: ["조용한", "웅변의", "피곤한", "아름다운"],
      correctAnswer: 1,
    },
    {
      word: "Diligent",
      question: "이 단어의 뜻은?",
      options: ["게으른", "똑똑한", "부지런한", "친절한"],
      correctAnswer: 2,
    },
  ];

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      navigate("/app/quiz/result", { state: { score, total: questions.length } });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm mb-4">
              객관식 문제
            </div>
            <h1 className="text-4xl mb-4">{question.word}</h1>
            <p className="text-muted-foreground">{question.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                    showCorrect
                      ? "bg-green-50 border-green-500"
                      : showWrong
                      ? "bg-red-50 border-red-500"
                      : isSelected
                      ? "bg-primary/5 border-primary"
                      : "bg-white border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={showCorrect || showWrong ? "" : ""}>{option}</span>
                    {showCorrect && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {showWrong && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className="mt-6">
              {selectedAnswer === question.correctAnswer ? (
                <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Check className="w-5 h-5" />
                    <span>정답입니다! 🎉</span>
                  </div>
                  <p className="text-sm text-green-600">잘하셨어요!</p>
                </div>
              ) : (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <X className="w-5 h-5" />
                    <span>틀렸습니다</span>
                  </div>
                  <p className="text-sm text-red-600">
                    정답은 "{question.options[question.correctAnswer]}"입니다
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      {showResult && (
        <div className="px-6 pb-8">
          <Button
            onClick={handleNext}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl"
          >
            {currentQuestion < questions.length - 1 ? "다음 문제" : "결과 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}