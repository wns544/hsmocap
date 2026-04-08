import { Link } from "react-router";
import { Award, BookOpen, ChevronRight, Clock, Layers, Target, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { recentWordIds, words } from "../lib/words";

export default function Home() {
  const stats = [
    { label: "학습한 단어", value: "247", icon: BookOpen, color: "bg-blue-500" },
    { label: "퀴즈 정답률", value: "87%", icon: Target, color: "bg-primary" },
    { label: "연속 학습", value: "12일", icon: TrendingUp, color: "bg-orange-500" },
  ];

  const quickActions = [
    { title: "학습하기", subtitle: "문장 퀴즈로 단어를 학습해요", path: "/app/sentence-quiz", icon: BookOpen, color: "bg-green-500" },
    { title: "Shorts 학습", subtitle: "카드 넘기며 빠르게 복습해요", path: "/app/flashcard-study", icon: Layers, color: "bg-purple-500" },
    { title: "복습하기", subtitle: "42개의 복습 대기 단어", path: "/app/review", icon: TrendingUp, color: "bg-orange-500" },
  ];

  const recentWords = recentWordIds
    .map((id) => words.find((word) => word.id === id))
    .filter((word): word is NonNullable<typeof word> => word !== undefined);

  const studyHistory = [
    { date: "2024년 3월 29일", wordsLearned: 15, correctRate: 87 },
    { date: "2024년 3월 28일", wordsLearned: 20, correctRate: 92 },
    { date: "2024년 3월 27일", wordsLearned: 18, correctRate: 84 },
    { date: "2024년 3월 26일", wordsLearned: 12, correctRate: 79 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1">안녕하세요, 소희님</h1>
            <p className="text-white/80">오늘도 목표 단어를 함께 채워봐요.</p>
          </div>
          <Link to="/app/profile">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">S</span>
            </div>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">오늘의 학습 진행도</span>
            <span className="text-sm">8 / 20 단어</span>
          </div>
          <Progress value={40} className="h-2 bg-white/20" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-4 border border-border">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-2xl mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl mb-4">빠른 시작</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <action.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.subtitle}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">최근 학습한 단어</h2>
            <Link to="/app/words">
              <Button variant="ghost" size="sm" className="text-primary">
                전체보기
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentWords.map((item) => (
              <Link key={item.id} to={`/app/words/${item.id}`}>
                <div className="bg-white rounded-2xl p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="mb-1">{item.word}</div>
                      <div className="text-sm text-muted-foreground">{item.meaning}</div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.mastery >= 90 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">과거 학습 기록</h2>
          </div>
          <div className="space-y-3">
            {studyHistory.map((record, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1">{record.date}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">학습한 단어</div>
                    <div className="text-lg font-semibold">{record.wordsLearned}개</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-muted-foreground mb-1">정답률</div>
                    <div className="text-lg font-semibold text-green-600">{record.correctRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
