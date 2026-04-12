import { useNavigate } from "react-router";
import { Brain, Zap, Clock, Target, ArrowLeft } from "lucide-react";

export default function QuizStart() {
  const navigate = useNavigate();

  const quizModes = [
    {
      title: "객관식 퀴즈",
      description: "보기 중 정답을 골라 빠르게 감을 익혀보세요.",
      icon: Brain,
      color: "bg-blue-500",
      path: "/app/quiz/multiple-choice",
      difficulty: "쉬움",
      questions: 10,
    },
    {
      title: "주관식 퀴즈",
      description: "뜻을 보고 단어를 직접 입력해보세요.",
      icon: Zap,
      color: "bg-primary",
      path: "/app/quiz/short-answer",
      difficulty: "도전",
      questions: 10,
    },
  ];

  const stats = [
    { label: "평균 점수", value: "87점", icon: Target },
    { label: "완료한 퀴즈", value: "42회", icon: Brain },
    { label: "평균 시간", value: "3분", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-3xl mb-2">퀴즈 시작</h1>
        <p className="text-white/80">오늘 공부한 단어를 퀴즈로 다시 확인해보세요.</p>
      </div>

      <div className="px-6 mt-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-border text-center">
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-lg mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl mb-4">퀴즈 유형 선택</h2>
          {quizModes.map((mode) => (
            <div
              key={mode.title}
              onClick={() => navigate(mode.path)}
              className="bg-white rounded-2xl p-6 border border-border cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 ${mode.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <mode.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg">{mode.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        mode.difficulty === "쉬움" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {mode.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{mode.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{mode.questions}문제</span>
                    <span>약 5분</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
          <h3 className="mb-3">퀴즈 팁</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>문제를 천천히 읽고 답을 떠올린 뒤 선택해보세요.</li>
            <li>틀린 문제는 복습 화면에서 다시 확인하면 더 오래 기억돼요.</li>
            <li>매일 짧게 반복하면 학습 감각이 빠르게 돌아옵니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
