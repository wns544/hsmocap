import { Link } from "react-router";
import { RotateCcw, Calendar, ChevronRight, PlayCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function ReviewList() {
  const reviewItems = [
    {
      id: 1,
      word: "Serendipity",
      meaning: "뜻밖의 행운",
      reviewCount: 3,
      nextReview: "오늘",
      dueDate: "2026-03-27",
      isUrgent: true,
    },
    {
      id: 2,
      word: "Eloquent",
      meaning: "웅변의",
      reviewCount: 2,
      nextReview: "내일",
      dueDate: "2026-03-28",
      isUrgent: false,
    },
    {
      id: 3,
      word: "Diligent",
      meaning: "부지런한",
      reviewCount: 5,
      nextReview: "3일 후",
      dueDate: "2026-03-30",
      isUrgent: false,
    },
    {
      id: 4,
      word: "Benevolent",
      meaning: "자비로운",
      reviewCount: 1,
      nextReview: "오늘",
      dueDate: "2026-03-27",
      isUrgent: true,
    },
    {
      id: 5,
      word: "Compassion",
      meaning: "연민",
      reviewCount: 4,
      nextReview: "1주일 후",
      dueDate: "2026-04-03",
      isUrgent: false,
    },
  ];

  const urgentCount = reviewItems.filter((item) => item.isUrgent).length;
  const totalCount = reviewItems.length;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-3xl mb-2">복습하기</h1>
        <p className="text-white/80">주기적으로 복습하고 기억을 강화하세요</p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl mb-1">{urgentCount}</div>
            <div className="text-sm text-white/80">오늘 복습할 단어</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl mb-1">{totalCount}</div>
            <div className="text-sm text-white/80">전체 복습 대기</div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {/* Quick Start */}
        {urgentCount > 0 && (
          <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl mb-6 flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            오늘 복습 시작하기 ({urgentCount}개)
          </Button>
        )}

        {/* Review List */}
        <div className="mb-4">
          <h2 className="text-xl mb-4">복습 일정</h2>
        </div>

        <div className="space-y-3">
          {reviewItems.map((item) => (
            <Link key={item.id} to={`/app/words/${item.id}`}>
              <div
                className={`bg-white rounded-2xl p-5 border-2 ${
                  item.isUrgent ? "border-primary" : "border-border"
                } active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg">{item.word}</h3>
                      {item.isUrgent && (
                        <Badge variant="secondary" className="bg-primary text-white">
                          오늘
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{item.meaning}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <RotateCcw className="w-4 h-4" />
                        <span>{item.reviewCount}회 복습</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{item.nextReview}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
          <h3 className="mb-3">📚 복습 시스템</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            과학적으로 증명된 간격 반복 학습법을 사용합니다. 기억이 희미해지기 전에 최적의 타이밍에
            복습 알림을 보내드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}