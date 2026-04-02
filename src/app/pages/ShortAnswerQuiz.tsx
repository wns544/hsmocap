import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";

export default function ShortAnswerQuiz() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      meaning: "뜻밖의 행운",
      correctAnswer: "serendipity",
      hint: "S로 시작하는 단어",
    },
    {
      meaning: "웅변의, 설득력 있는",
      correctAnswer: "eloquent",
      hint: "E로 시작하는 단어",
    },
    {
      meaning: "부지런한",
      correctAnswer: "diligent",
      hint: "D로 시작하는 단어",
    },
  ];

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    setShowResult(true);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswer("");
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
            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm mb-6">
              주관식 문제
            </div>
            <h2 className="text-muted-foreground mb-3">다음 뜻에 해당하는 영어 단어는?</h2>
            <h1 className="text-4xl mb-6">{question.meaning}</h1>
            <div className="inline-block px-3 py-1 bg-accent rounded-lg text-sm text-muted-foreground">
              💡 힌트: {question.hint}
            </div>
          </div>

          {/* Answer Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="영어 단어를 입력하세요"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={showResult}
              className={`h-16 text-center text-xl rounded-2xl ${
                showResult
                  ? isCorrect
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-red-50 border-red-500 text-red-700"
                  : "bg-input-background"
              }`}
              autoComplete="off"
            />

            {!showResult && (
              <Button
                type="submit"
                disabled={!answer.trim()}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl"
              >
                확인
              </Button>
            )}
          </form>

          {/* Result Feedback */}
          {showResult && (
            <div className="mt-6 space-y-4">
              {isCorrect ? (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl text-green-700 mb-2">정답입니다! 🎉</h3>
                  <p className="text-sm text-green-600">완벽해요!</p>
                </div>
              ) : (
                <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl text-red-700 mb-2">틀렸습니다</h3>
                  <p className="text-sm text-red-600 mb-3">정답은 다음과 같습니다</p>
                  <div className="inline-block px-4 py-2 bg-white rounded-xl">
                    <span className="text-lg">{question.correctAnswer}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleNext}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl"
              >
                {currentQuestion < questions.length - 1 ? "다음 문제" : "결과 보기"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}