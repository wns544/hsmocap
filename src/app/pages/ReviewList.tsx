import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { RotateCcw, Calendar, ChevronRight, PlayCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { shuffleArray } from "../lib/random";
import {
  listReviewQueueWordIds,
  listWordProgresses,
  type WordProgressRecord,
} from "../lib/wordProgresses";
import { words as localWords } from "../lib/words";
import { normalizeQuizWordDocs } from "../lib/wordsAdapter";

interface ReviewItem {
  id: string;
  word: string;
  meaning: string;
  level: string;
  reviewCount: number;
  nextReview: string;
  dueDate: string;
  isUrgent: boolean;
  mastery: number;
}

const REVIEW_QUEUE_STORAGE_KEY = "review-queue-word-ids";

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

function formatDueDate(nextReviewAt: Date | null) {
  if (!nextReviewAt) {
    return "-";
  }

  return nextReviewAt.toLocaleDateString("ko-KR");
}

export default function ReviewList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedLevel = searchParams.get("level");

  useEffect(() => {
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

        const normalizedWords = normalizeQuizWordDocs(wordsSnapshot.docs);
        const firestoreWordMap = new Map(
          normalizedWords.map((item) => [item.word.toLowerCase(), item]),
        );
        const fallbackWordMap = new Map(
          localWords.map((item) => [item.word.toLowerCase(), item]),
        );

        const now = new Date();
        const reviewQueueIdSet = new Set(reviewQueueIds.map((item) => item.toLowerCase()));
        const selectedProgresses = progresses.filter((item) =>
          reviewQueueIdSet.has(item.wordId.toLowerCase()),
        );

        const nextItems = selectedProgresses
          .map((progress): ReviewItem | null => {
            const firestoreWord = firestoreWordMap.get(progress.wordId.toLowerCase());
            const fallbackWord = fallbackWordMap.get(progress.wordId.toLowerCase());

            const word = firestoreWord?.word ?? fallbackWord?.word ?? progress.wordId;
            const meaning =
              firestoreWord?.meaning ??
              fallbackWord?.meaning ??
              "아직 단어 뜻 정보가 준비되지 않았습니다.";
            const level = firestoreWord?.level ?? fallbackWord?.level ?? "전체";
            const mastery =
              fallbackWord?.mastery ??
              (progress.totalAnswerCount > 0
                ? Math.round((progress.correctAnswerCount / progress.totalAnswerCount) * 100)
                : 0);

            if (selectedLevel && selectedLevel !== "전체" && level !== selectedLevel) {
              return null;
            }

            return {
              id: progress.wordId,
              word,
              meaning,
              level,
              reviewCount: progress.totalAnswerCount,
              nextReview: formatNextReviewLabel(progress.nextReviewAt, now),
              dueDate: formatDueDate(progress.nextReviewAt),
              isUrgent:
                progress.lastResult === "wrong" ||
                (progress.nextReviewAt !== null && progress.nextReviewAt.getTime() <= now.getTime()),
              mastery,
            };
          })
          .filter((item): item is ReviewItem => item !== null);

        setItems(shuffleArray(nextItems));
      } catch (error) {
        console.error("복습 목록을 불러오지 못했습니다.", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReviewItems();
  }, [selectedLevel, user]);

  const urgentCount = useMemo(
    () => items.filter((item) => item.isUrgent).length,
    [items],
  );
  const totalCount = items.length;

  const startReviewSession = (wordIds: string[]) => {
    if (wordIds.length === 0) {
      return;
    }

    window.sessionStorage.setItem(REVIEW_QUEUE_STORAGE_KEY, JSON.stringify(wordIds));
    navigate("/app/sentence-quiz?mode=review");
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-3xl mb-2">복습하기</h1>
        <p className="text-white/80">
          {selectedLevel && selectedLevel !== "전체"
            ? `${selectedLevel} 레벨 단어만 골라서 복습합니다.`
            : "틀렸거나 아직 약한 단어를 다시 복습합니다."}
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
          <Button
            onClick={() =>
              startReviewSession(items.filter((item) => item.isUrgent).map((item) => item.word))
            }
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl mb-6 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            오늘 복습 시작하기 ({urgentCount}개)
          </Button>
        )}

        <div className="mb-4">
          <h2 className="text-xl mb-4">복습 일정</h2>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
            복습 대상을 불러오는 중입니다.
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-border text-sm text-muted-foreground">
            지금 복습할 단어가 없습니다. 문장 퀴즈를 풀고 다시 확인해보세요.
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
        )}

        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
          <h3 className="mb-3">복습 가이드</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            틀렸거나 아직 약한 단어를 우선으로 복습 목록에 보여줍니다. 현재 단계에서는 기존 UI를 유지하면서
            Firestore의 진행도 데이터만 연결하는 방식으로 동작합니다.
          </p>
          {totalCount > 0 && (
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => startReviewSession(items.map((item) => item.word))}
            >
              전체 복습 시작
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
