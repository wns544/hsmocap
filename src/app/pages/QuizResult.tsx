import { useLocation, useNavigate } from "react-router";
import { Trophy, Target, TrendingUp, Home, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/button";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export default function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { score = 0, total = 0 } = location.state || {};

  const percentage = Math.round((score / total) * 100);
  const isPerfect = score === total;
  const isGood = percentage >= 70;

  useEffect(() => {
    if (isPerfect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isPerfect]);

  const getMessage = () => {
    if (isPerfect) return "완벽합니다! 🎉";
    if (percentage >= 80) return "훌륭해요! 👏";
    if (percentage >= 60) return "잘했어요! 💪";
    return "다시 도전해보세요! 📚";
  };

  const stats = [
    { label: "정답 개수", value: `${score}/${total}`, icon: Target, color: "bg-primary" },
    { label: "정답률", value: `${percentage}%`, icon: TrendingUp, color: "bg-blue-500" },
    { label: "획득 포인트", value: `+${score * 10}`, icon: Trophy, color: "bg-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Result Header */}
      <div className={`${isGood ? "bg-primary" : "bg-muted"} text-white px-6 pt-16 pb-12 rounded-b-3xl`}>
        <div className="text-center">
          <div className={`w-24 h-24 ${isGood ? "bg-white/20" : "bg-white"} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Trophy className={`w-12 h-12 ${isGood ? "text-white" : "text-muted-foreground"}`} strokeWidth={2.5} />
          </div>
          <h1 className={`text-3xl mb-3 ${!isGood && "text-foreground"}`}>{getMessage()}</h1>
          <p className={`text-lg ${isGood ? "text-white/80" : "text-muted-foreground"}`}>
            퀴즈를 완료했습니다
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-8 flex-1">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 border border-border text-center">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-xl mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 border border-border mb-6">
          <h3 className="mb-4">퀴즈 요약</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">총 문제 수</span>
              <span>{total}문제</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">정답</span>
              <span className="text-primary">{score}개</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">오답</span>
              <span className="text-destructive">{total - score}개</span>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">최종 점수</span>
              <span className="text-xl text-primary">{percentage}점</span>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-accent rounded-2xl p-5 border border-border mb-6">
          <h3 className="mb-3">💡 학습 팁</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isPerfect
              ? "완벽한 점수에요! 이 실력을 유지하기 위해 매일 조금씩 학습해보세요."
              : percentage >= 70
              ? "훌륭해요! 틀린 문제는 오답 노트에서 다시 확인해보세요."
              : "포기하지 마세요! 틀린 문제를 복습하고 다시 도전해보세요."}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8 space-y-3">
        {(total - score) > 0 && (
          <Button
            onClick={() => navigate("/app/wrong-answers")}
            variant="outline"
            className="w-full h-14 rounded-xl border-2"
          >
            오답 노트 보기 ({total - score}개)
          </Button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/app/quiz")}
            variant="outline"
            className="h-14 rounded-xl"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            다시 풀기
          </Button>
          <Button
            onClick={() => navigate("/app/home")}
            className="h-14 bg-primary hover:bg-primary/90 text-white rounded-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            홈으로
          </Button>
        </div>
      </div>
    </div>
  );
}