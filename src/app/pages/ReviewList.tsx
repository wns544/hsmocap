import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Calendar, ChevronLeft, ChevronRight, PlayCircle, RotateCcw } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { shuffleArray } from "../lib/random";
import {
  listReviewQueueWordIds,
  listWordProgresses,
  type WordProgressRecord,
} from "../lib/wordProgresses";
import { isQuizWordUsable, normalizeQuizWordDocs, type NormalizedQuizWord } from "../lib/wordsAdapter";

interface ReviewItem {
  id: string;
  word: string;
  meaning: string;
  level: string;
  reviewCount: number;
  nextReview: string;
  isUrgent: boolean;
  mastery: number;
}

const REVIEW_QUEUE_STORAGE_KEY = "review-queue-word-ids";
const ALL_LEVEL = "전체";

function formatNextReviewLabel(nextReviewAt: Date | null, now: Date) {
  if (!nextReviewAt) {
    return "복습 예정 없음";
  }

  const diffMs = nextReviewAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "오늘";
  if (diffDays === 1) return "내일";
  if (diffDays < 7) return `${diffDays}일 후`;
  return `${Math.ceil(diffDays / 7)}주 후`;
}

function isUrgentReview(progress: WordProgressRecord, now: Date) {
  return (
    progress.lastResult === "wrong" ||
    (progress.nextReviewAt !== null && progress.nextReviewAt.getTime() <= now.getTime())
  );
}

function buildQuizReadyWordMap(words: NormalizedQuizWord[]) {
  return new Map(
    words
      .filter(isQuizWordUsable)
      .map((word) => [word.word.toLowerCase(), word]),
  );
}

export default function ReviewList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedLevel = searchParams.get("level");

  useEffect(() => {
    let isMounted = true;

    const loadReviewItems = async () => {
      if (!user) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [progresses, reviewQueueIds, wordsSnapshot] = await Promise.all([
          listWordProgresses(user.uid),
          listReviewQueueWordIds(user.uid),
          getDocs(query(collection(db, "words"), orderBy("createdAt", "desc"))),
        ]);

        const now = new Date();
        const quizReadyWordMap = buildQuizReadyWordMap(normalizeQuizWordDocs(wordsSnapshot.docs));
        const reviewQueueIdSet = new Set(reviewQueueIds.map((item) => item.toLowerCase()));

        const nextItems = progresses
          .filter((progress) => reviewQueueIdSet.has(progress.wordId.toLowerCase()))
          .map((progress): ReviewItem | null => {
            const quizWord = quizReadyWordMap.get(progress.wordId.toLowerCase());

            // 문장 퀴즈로 실제 출제 가능한 단어만 복습 목록에 표시한다.
            if (!quizWord) {
              return null;
            }

            if (selectedLevel && selectedLevel !== ALL_LEVEL && quizWord.level !== selectedLevel) {
              return null;
            }

            const mastery =
              progress.totalAnswerCount > 0
                ? Math.round((progress.correctAnswerCount / progress.totalAnswerCount) * 100)
                : 0;

            return {
              id: progress.wordId,
              word: quizWord.word,
              meaning: quizWord.meaning,
              level: quizWord.level || ALL_LEVEL,
              reviewCount: progress.totalAnswerCount,
              nextReview: formatNextReviewLabel(progress.nextReviewAt, now),
              isUrgent: isUrgentReview(progress, now),
              mastery,
            };
          })
          .filter((item): item is ReviewItem => item !== null);

        if (!isMounted) return;
        setItems(shuffleArray(nextItems));
      } catch (error) {
        console.error("복습 목록을 불러오지 못했습니다.", error);
        if (!isMounted) return;
        setItems([]);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadReviewItems();

    return () => {
      isMounted = false;
    };
  }, [selectedLevel, user]);

  const urgentItems = useMemo(() => items.filter((item) => item.isUrgent), [items]);
  const urgentCount = urgentItems.length;
  const totalCount = items.length;

  const startReviewSession = (reviewItems: ReviewItem[]) => {
    if (reviewItems.length === 0) {
      return;
    }

    window.sessionStorage.setItem(
      REVIEW_QUEUE_STORAGE_KEY,
      JSON.stringify(reviewItems.map((item) => item.word)),
    );
    navigate("/app/sentence-quiz?mode=review");
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="rounded-b-3xl bg-primary px-6 pb-8 pt-12 text-white">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="mb-2 text-3xl">복습하기</h1>
        <p className="text-white/80">
          {selectedLevel && selectedLevel !== ALL_LEVEL
            ? `${selectedLevel} 레벨 단어만 골라 복습합니다.`
            : "틀렸거나 아직 약한 단어를 다시 복습합니다."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-1 text-2xl">{urgentCount}</div>
            <div className="text-sm text-white/80">오늘 복습할 단어</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="mb-1 text-2xl">{totalCount}</div>
            <div className="text-sm text-white/80">전체 복습 대기</div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-6">
        {urgentCount > 0 && (
          <Button
            onClick={() => startReviewSession(urgentItems)}
            className="mb-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-white hover:bg-primary/90"
          >
            <PlayCircle className="h-5 w-5" />
            오늘 복습 시작하기 ({urgentCount}개)
          </Button>
        )}

        <div className="mb-4">
          <h2 className="mb-4 text-xl">복습 일정</h2>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
            복습 대상을 불러오는 중입니다.
          </div>
        ) : totalCount === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
            지금 복습할 단어가 없습니다. 문장 퀴즈에서 오답이나 약한 단어를 만든 뒤 다시 확인해보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/app/words/${encodeURIComponent(item.id)}?word=${encodeURIComponent(item.word)}`}
                state={{
                  word: {
                    id: item.id,
                    word: item.word,
                    meaning: item.meaning,
                    level: item.level,
                    mastery: item.mastery,
                    isFavorite: false,
                  },
                }}
              >
                <div
                  className={`rounded-2xl border-2 bg-white p-5 transition-transform active:scale-[0.98] ${
                    item.isUrgent ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
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
                      <p className="mb-3 text-muted-foreground">{item.meaning}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <RotateCcw className="h-4 w-4" />
                          <span>{item.reviewCount}회 복습</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{item.nextReview}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-border bg-accent p-5">
          <h3 className="mb-3">복습 안내</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            틀렸거나 아직 약한 단어 중에서 문장 퀴즈 데이터가 준비된 단어만 복습 목록에 표시합니다.
            그래서 화면에 표시된 복습 개수와 실제 복습 퀴즈 진입 개수가 일치합니다.
          </p>
          {totalCount > 0 && (
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => startReviewSession(items)}
            >
              전체 복습 시작
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
