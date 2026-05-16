import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Award, BookOpen, ChevronRight, Clock, Layers, Target, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthContext";
import { resolveProfileName, subscribeProfileName } from "../lib/profileName";
import { buildWordLookup, listWordLibraryItems, type WordLibraryItem } from "../lib/wordLibrary";
import { listReviewQueueWordIds, listWordProgresses, type WordProgressRecord } from "../lib/wordProgresses";
import { recentWordIds, words } from "../lib/words";

interface StudyHistoryRecord {
  date: string;
  wordsLearned: number;
  correctRate: number;
}

const DAILY_GOAL = 20;

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateStreakDays(progresses: WordProgressRecord[]) {
  const days = new Set(
    progresses
      .map((progress) => progress.lastReviewedAt)
      .filter((date): date is Date => date !== null)
      .map(getDayKey),
  );

  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();

  while (days.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildStudyHistory(progresses: WordProgressRecord[]) {
  const grouped = new Map<string, { date: Date; wordsLearned: number; total: number; correct: number }>();

  for (const progress of progresses) {
    const date = progress.lastReviewedAt;
    if (!date || progress.totalAnswerCount <= 0) continue;

    const key = getDayKey(date);
    const existing = grouped.get(key) ?? {
      date,
      wordsLearned: 0,
      total: 0,
      correct: 0,
    };

    existing.wordsLearned += 1;
    existing.total += progress.totalAnswerCount;
    existing.correct += progress.correctAnswerCount;
    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 4)
    .map((record): StudyHistoryRecord => ({
      date: formatDate(record.date),
      wordsLearned: record.wordsLearned,
      correctRate: record.total > 0 ? Math.round((record.correct / record.total) * 100) : 0,
    }));
}

function buildRecentWords(progresses: WordProgressRecord[], wordLibrary: WordLibraryItem[]) {
  const lookup = buildWordLookup(wordLibrary);
  const fromProgress = progresses
    .filter((progress) => progress.totalAnswerCount > 0)
    .sort((left, right) => {
      const leftTime = left.updatedAt?.getTime() ?? left.lastReviewedAt?.getTime() ?? 0;
      const rightTime = right.updatedAt?.getTime() ?? right.lastReviewedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .map((progress) => lookup.find(progress.wordId))
    .filter((word): word is WordLibraryItem => word !== null)
    .slice(0, 3);

  if (fromProgress.length > 0) {
    return fromProgress;
  }

  return recentWordIds
    .map((id) => words.find((word) => word.id === id))
    .filter((word): word is NonNullable<typeof word> => word !== undefined)
    .map((word) => ({
      id: String(word.id),
      word: word.word,
      meaning: word.meaning,
      level: word.level,
      mastery: word.mastery,
    }));
}

export default function Home() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(() => resolveProfileName(user?.displayName, user?.email));
  const [reviewQueueCount, setReviewQueueCount] = useState(0);
  const [progresses, setProgresses] = useState<WordProgressRecord[]>([]);
  const [recentWords, setRecentWords] = useState<WordLibraryItem[]>([]);

  const today = useMemo(() => new Date(), []);
  const learnedWords = progresses.filter((progress) => progress.totalAnswerCount > 0).length;
  const todayLearnedWords = progresses.filter(
    (progress) => progress.lastReviewedAt && isSameDay(progress.lastReviewedAt, today),
  ).length;
  const totalAnswers = progresses.reduce((sum, progress) => sum + progress.totalAnswerCount, 0);
  const correctAnswers = progresses.reduce((sum, progress) => sum + progress.correctAnswerCount, 0);
  const accuracyRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const streakDays = calculateStreakDays(progresses);
  const studyHistory = buildStudyHistory(progresses);

  const stats = [
    { label: "학습한 단어", value: `${learnedWords}`, icon: BookOpen, color: "bg-blue-500" },
    { label: "퀴즈 정답률", value: `${accuracyRate}%`, icon: Target, color: "bg-primary" },
    { label: "연속 학습", value: `${streakDays}일`, icon: TrendingUp, color: "bg-orange-500" },
  ];

  const quickActions = [
    {
      title: "학습하기",
      subtitle: "문장 퀴즈로 단어를 학습해요",
      path: "/app/sentence-quiz",
      icon: BookOpen,
      color: "bg-green-500",
    },
    {
      title: "Shorts 학습",
      subtitle: "카드 넘기기로 빠르게 복습해요",
      path: "/app/flashcard-study",
      icon: Layers,
      color: "bg-purple-500",
    },
    {
      title: "복습하기",
      subtitle: `${reviewQueueCount}개의 복습 대기 단어`,
      path: "/app/review",
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  useEffect(() => {
    setDisplayName(resolveProfileName(user?.displayName, user?.email));

    return subscribeProfileName((nextName) => {
      setDisplayName(nextName || resolveProfileName(user?.displayName, user?.email));
    });
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!user) {
        setReviewQueueCount(0);
        setProgresses([]);
        setRecentWords(buildRecentWords([], []));
        return;
      }

      try {
        const [queue, progressItems, wordLibrary] = await Promise.all([
          listReviewQueueWordIds(user.uid),
          listWordProgresses(user.uid),
          listWordLibraryItems(),
        ]);

        if (!isMounted) return;
        setReviewQueueCount(queue.length);
        setProgresses(progressItems);
        setRecentWords(buildRecentWords(progressItems, wordLibrary));
      } catch (error) {
        console.error("홈 대시보드 데이터를 불러오지 못했습니다.", error);
        if (!isMounted) return;
        setReviewQueueCount(0);
        setProgresses([]);
        setRecentWords(buildRecentWords([], []));
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mb-1">{`안녕하세요, ${displayName}님`}</h1>
            <p className="text-white/80">오늘도 목표 단어를 차근차근 채워봐요.</p>
          </div>
          <Link to="/app/profile">
            <div className="min-w-12 h-12 px-4 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">프로필</span>
            </div>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">오늘의 학습 진행도</span>
            <span className="text-sm">
              {todayLearnedWords} / {DAILY_GOAL} 단어
            </span>
          </div>
          <Progress
            value={Math.min(100, (todayLearnedWords / DAILY_GOAL) * 100)}
            className="h-2 bg-white/20 [&_[data-slot=progress-indicator]]:bg-[#D8C3A5]"
          />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-border">
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
            {quickActions.map((action) => (
              <Link key={action.title} to={action.path}>
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
              <Link
                key={item.id}
                to={`/app/words/${encodeURIComponent(item.id)}?word=${encodeURIComponent(item.word)}`}
                state={{ word: item }}
              >
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
          {studyHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
              아직 학습 기록이 없습니다. 문장 퀴즈를 풀면 기록이 표시됩니다.
            </div>
          ) : (
            <div className="space-y-3">
              {studyHistory.map((record) => (
                <div key={record.date} className="bg-white rounded-2xl p-4 border border-border">
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
          )}
        </div>
      </div>
    </div>
  );
}
