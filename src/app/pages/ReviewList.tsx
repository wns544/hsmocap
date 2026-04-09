import { Link, useSearchParams } from "react-router";
import { Calendar, ChevronRight, PlayCircle, RotateCcw } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { shuffleArray } from "../lib/random";

interface ReviewItem {
  id: number;
  word: string;
  meaning: string;
  level: string;
  reviewCount: number;
  nextReview: string;
  dueDate: string;
  isUrgent: boolean;
}

const reviewItems: ReviewItem[] = [
  { id: 1, word: "Serendipity", meaning: "뜻밖의 행운", level: "고급", reviewCount: 3, nextReview: "오늘", dueDate: "2026-04-09", isUrgent: true },
  { id: 2, word: "Eloquent", meaning: "웅변적인", level: "고급", reviewCount: 2, nextReview: "내일", dueDate: "2026-04-10", isUrgent: false },
  { id: 3, word: "Diligent", meaning: "근면한", level: "초급", reviewCount: 5, nextReview: "3일 후", dueDate: "2026-04-12", isUrgent: false },
  { id: 4, word: "Benevolent", meaning: "자비로운", level: "고급", reviewCount: 1, nextReview: "오늘", dueDate: "2026-04-09", isUrgent: true },
  { id: 5, word: "Compassion", meaning: "연민", level: "중급", reviewCount: 4, nextReview: "1주일 후", dueDate: "2026-04-16", isUrgent: false },
  { id: 6, word: "Frugal", meaning: "검소한", level: "비즈니스", reviewCount: 2, nextReview: "내일", dueDate: "2026-04-10", isUrgent: false },
];

export default function ReviewList() {
  const [searchParams] = useSearchParams();
  const selectedLevel = searchParams.get("level");

  const filteredReviewItems = shuffleArray(
    !selectedLevel || selectedLevel === "전체"
      ? reviewItems
      : reviewItems.filter((item) => item.level === selectedLevel),
  );

  const urgentCount = filteredReviewItems.filter((item) => item.isUrgent).length;
  const totalCount = filteredReviewItems.length;

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-3xl mb-2">복습하기</h1>
        <p className="text-white/80">
          {selectedLevel && selectedLevel !== "전체"
            ? `${selectedLevel} 레벨 단어만 골라서 복습합니다.`
            : "전체 단어를 주기적으로 복습합니다."}
        </p>

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
        {urgentCount > 0 && (
          <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl mb-6 flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            오늘 복습 시작하기 ({urgentCount}개)
          </Button>
        )}

        <div className="mb-4">
          <h2 className="text-xl mb-4">복습 일정</h2>
        </div>

        <div className="space-y-3">
          {filteredReviewItems.map((item) => (
            <Link key={item.id} to={`/app/words/${item.id}?word=${encodeURIComponent(item.word)}`}>
              <div
                className={`bg-white rounded-2xl p-5 border-2 ${
                  item.isUrgent ? "border-primary" : "border-border"
                } active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg">{item.word}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {item.level}
                      </Badge>
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

        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
          <h3 className="mb-3">복습 가이드</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            학습창에서 고른 레벨에 맞춰 복습 목록을 보여줍니다. 백엔드 구조는 바꾸지 않고 프론트에서만
            필터링합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
