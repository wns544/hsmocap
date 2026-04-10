import { Link } from "react-router";
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock3,
  Flame,
  Layers,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";

const todayLabel = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
}).format(new Date());

export default function Home() {
  const stats = [
    { label: "학습한 단어", value: "247", icon: BookOpen, color: "bg-sky-500" },
    { label: "정답률", value: "87%", icon: Target, color: "bg-emerald-500" },
    { label: "연속 학습", value: "12일", icon: Flame, color: "bg-orange-500" },
  ];

  const quickActions = [
    {
      title: "문장 퀴즈 시작",
      subtitle: "문맥 속에서 단어를 직접 떠올리며 풀어보세요.",
      path: "/app/sentence-quiz",
      icon: BookOpen,
      color: "bg-emerald-500",
    },
    {
      title: "플래시카드 학습",
      subtitle: "짧고 빠르게 오늘의 단어를 복습할 수 있어요.",
      path: "/app/flashcard-study",
      icon: Layers,
      color: "bg-indigo-500",
    },
    {
      title: "오답 복습",
      subtitle: "다시 볼 문제 42개가 기다리고 있어요.",
      path: "/app/review",
      icon: TrendingUp,
      color: "bg-amber-500",
    },
  ];

  const recentWords = [
    { word: "Serendipity", meaning: "뜻밖의 행운", mastery: 85 },
    { word: "Ephemeral", meaning: "덧없는, 일시적인", mastery: 92 },
    { word: "Eloquent", meaning: "표현력이 뛰어난", mastery: 78 },
  ];

  const studyHistory = [
    { date: "4월 9일", wordsLearned: 15, correctRate: 87, duration: "25분" },
    { date: "4월 8일", wordsLearned: 20, correctRate: 92, duration: "32분" },
    { date: "4월 7일", wordsLearned: 18, correctRate: 84, duration: "28분" },
    { date: "4월 6일", wordsLearned: 12, correctRate: 79, duration: "18분" },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf9_0%,#eef7f3_100%)]">
      <div className="rounded-b-[2rem] bg-[linear-gradient(135deg,#065f46_0%,#10b981_55%,#6ee7b7_100%)] px-6 pb-8 pt-12 text-white shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="mb-2 text-sm text-white/80">{todayLabel}</p>
            <h1 className="text-3xl font-semibold tracking-tight">오늘도 한 걸음 더</h1>
            <p className="mt-1 text-white/85">짧게라도 이어가면 기억은 훨씬 오래 남아요.</p>
          </div>
          <Link to="/app/profile">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-lg font-semibold backdrop-blur-sm">
              W
            </div>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/12 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">오늘의 목표</p>
              <p className="mt-1 text-lg font-medium">20개 중 8개 학습 완료</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2 text-right">
              <div className="text-xs text-white/70">남은 학습</div>
              <div className="text-lg font-semibold">12개</div>
            </div>
          </div>
          <Progress value={40} className="h-2 bg-white/20" />
          <div className="mt-3 flex items-center justify-between text-sm text-white/75">
            <span>꾸준함이 가장 큰 실력입니다.</span>
            <span>40%</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">바로 시작하기</h2>
            <Link to="/app/quiz">
              <Button variant="ghost" size="sm" className="text-emerald-700">
                퀴즈 전체 보기
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.path}>
                <div className="flex items-center gap-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.985]">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{action.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{action.subtitle}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">최근 학습 단어</h2>
            <Link to="/app/words">
              <Button variant="ghost" size="sm" className="text-emerald-700">
                전체 보기
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentWords.map((item, index) => (
              <Link key={item.word} to={`/app/words/${index + 1}`}>
                <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{item.word}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.meaning}</div>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        item.mastery >= 90
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={item.mastery} className="h-1.5 flex-1" />
                    <span className="text-xs text-slate-500">{item.mastery}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">최근 학습 기록</h2>
          </div>
          <div className="space-y-3">
            {studyHistory.map((record) => (
              <div key={record.date} className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100">
                    <Clock3 className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{record.date}</div>
                    <div className="text-sm text-slate-500">학습 시간 {record.duration}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">학습한 단어</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{record.wordsLearned}개</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">정답률</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-600">{record.correctRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
