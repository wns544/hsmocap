import { useNavigate } from "react-router";
import { ArrowLeft, Brain, Clock3, Sparkles, Target, Zap } from "lucide-react";

export default function QuizStart() {
  const navigate = useNavigate();

  const quizModes = [
    {
      title: "객관식 퀴즈",
      description: "보기 중 정답을 골라 빠르게 감을 익히는 모드예요.",
      icon: Brain,
      color: "bg-sky-500",
      path: "/app/quiz/multiple-choice",
      difficulty: "쉬움",
      questions: 10,
      estimate: "약 3분",
    },
    {
      title: "주관식 퀴즈",
      description: "뜻을 보고 단어를 직접 입력하며 더 깊게 기억해요.",
      icon: Zap,
      color: "bg-emerald-500",
      path: "/app/quiz/short-answer",
      difficulty: "도전",
      questions: 10,
      estimate: "약 5분",
    },
  ];

  const stats = [
    { label: "평균 점수", value: "87점", icon: Target },
    { label: "완료한 퀴즈", value: "42회", icon: Brain },
    { label: "평균 시간", value: "3분", icon: Clock3 },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fcfa_0%,#edf8f3_100%)] pb-8">
      <div className="rounded-b-[2rem] bg-[linear-gradient(135deg,#064e3b_0%,#059669_55%,#6ee7b7_100%)] px-6 pb-8 pt-12 text-white shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="max-w-md">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90">
            <Sparkles className="h-4 w-4" />
            오늘의 학습 체크
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">퀴즈를 시작해볼까요?</h1>
          <p className="mt-2 text-white/80">
            짧게 푸는 퀴즈 한 번이 오늘 공부를 다시 떠올리게 해줘요.
          </p>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
              <stat.icon className="mx-auto mb-2 h-5 w-5 text-emerald-600" />
              <div className="text-lg font-semibold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">퀴즈 유형 선택</h2>
          {quizModes.map((mode) => (
            <button
              key={mode.title}
              type="button"
              onClick={() => navigate(mode.path)}
              className="w-full rounded-3xl border border-emerald-100 bg-white p-6 text-left shadow-sm transition-transform active:scale-[0.985]"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${mode.color}`}>
                  <mode.icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{mode.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        mode.difficulty === "쉬움"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {mode.difficulty}
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-slate-500">{mode.description}</p>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>{mode.questions}문제</span>
                    <span>{mode.estimate}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">퀴즈 팁</h3>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-500">
            <li>모르는 문제는 바로 넘기기보다 한 번 더 떠올려보면 기억에 오래 남아요.</li>
            <li>틀린 문제는 복습 화면에서 다시 확인하면 학습 효율이 더 좋아집니다.</li>
            <li>매일 5분만 이어가도 단어 감각이 꽤 빠르게 돌아와요.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
