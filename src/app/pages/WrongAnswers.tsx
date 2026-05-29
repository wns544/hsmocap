import { Link, useNavigate } from "react-router";
import { AlertCircle, ChevronLeft, ChevronRight, Trash2, PlayCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function WrongAnswers() {
  const navigate = useNavigate();
  const wrongAnswers = [
    {
      id: 1,
      word: "Ephemeral",
      meaning: "덧없는, 일시적인",
      yourAnswer: "영원한",
      correctAnswer: "덧없는",
      wrongCount: 3,
      date: "2026-03-25",
    },
    {
      id: 2,
      word: "Ubiquitous",
      meaning: "어디에나 있는",
      yourAnswer: "특별한",
      correctAnswer: "어디에나 있는",
      wrongCount: 2,
      date: "2026-03-26",
    },
    {
      id: 3,
      word: "Pragmatic",
      meaning: "실용적인",
      yourAnswer: "이론적인",
      correctAnswer: "실용적인",
      wrongCount: 1,
      date: "2026-03-27",
    },
    {
      id: 4,
      word: "Ambiguous",
      meaning: "모호한",
      yourAnswer: "명확한",
      correctAnswer: "모호한",
      wrongCount: 2,
      date: "2026-03-26",
    },
  ];

  const totalWrong = wrongAnswers.length;
  const needReview = wrongAnswers.filter((item) => item.wrongCount >= 2).length;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-destructive text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <button
          onClick={() => navigate("/app/review")}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl mb-1">오답 노트</h1>
            <p className="text-white/80">틀린 문제를 다시 확인하세요</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl mb-1">{totalWrong}</div>
            <div className="text-sm text-white/80">전체 오답</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="text-2xl mb-1">{needReview}</div>
            <div className="text-sm text-white/80">집중 복습 필요</div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {/* Quick Action */}
        {totalWrong > 0 && (
          <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl mb-6 flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            오답 퀴즈로 복습하기
          </Button>
        )}

        {/* Wrong Answers List */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">틀린 문제 목록</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              전체 삭제
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {wrongAnswers.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between mb-4">
                <Link to={`/app/words/${item.id}`} className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg">{item.word}</h3>
                    {item.wrongCount >= 2 && (
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                        {item.wrongCount}회 오답
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {new Date(item.date).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </Link>
                <button className="text-muted-foreground hover:text-destructive ml-2">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 bg-muted/30 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground min-w-[80px]">내 답변:</span>
                  <span className="text-sm text-destructive line-through">{item.yourAnswer}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground min-w-[80px]">정답:</span>
                  <span className="text-sm text-primary">{item.correctAnswer}</span>
                </div>
              </div>

              <Link to={`/words/${item.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-primary hover:text-primary"
                >
                  단어 자세히 보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border">
          <h3 className="mb-3">💡 학습 팁</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 오답은 잊기 전에 바로 복습하는 것이 효과적입니다</li>
            <li>• 2회 이상 틀린 단어는 집중적으로 학습하세요</li>
            <li>• 예문과 함께 단어를 외우면 기억에 오래 남습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
