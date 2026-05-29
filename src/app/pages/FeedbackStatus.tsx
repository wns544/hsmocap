import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, Clock3, Eye, MessageSquareWarning, SearchCheck } from "lucide-react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { type FeedbackRecord, subscribeUserFeedbacks } from "../lib/feedback";

function formatDate(value: Date | null) {
  if (!value) {
    return "방금 전";
  }

  return value.toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMeta(status: FeedbackRecord["status"]) {
  switch (status) {
    case "reviewing":
      return { label: "검토 중", className: "bg-amber-100 text-amber-700", icon: SearchCheck };
    case "resolved":
      return { label: "처리 완료", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 };
    default:
      return { label: "접수됨", className: "bg-sky-100 text-sky-700", icon: Clock3 };
  }
}

function getStatusDescription(status: FeedbackRecord["status"]) {
  switch (status) {
    case "reviewing":
      return "관리자가 내용을 확인하고 있습니다.";
    case "resolved":
      return "관리자가 처리를 완료했습니다.";
    default:
      return "피드백이 정상적으로 접수되었습니다.";
  }
}

export default function FeedbackStatus() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);

  useEffect(() => {
    if (!user) {
      setFeedbacks([]);
      return;
    }

    return subscribeUserFeedbacks(user.uid, setFeedbacks);
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-white border-b border-border px-6 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl mb-2">내 피드백 현황</h1>
        <p className="text-muted-foreground">보낸 피드백이 접수, 검토, 처리 완료 중 어디까지 왔는지 확인할 수 있어요.</p>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <Button onClick={() => navigate("/app/settings/feedback")} className="w-full rounded-2xl">
          새 피드백 보내기
        </Button>

        {feedbacks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-8 text-center">
            <MessageSquareWarning className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="mb-2">아직 보낸 피드백이 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              버그 제보나 개선 의견을 보내면 여기에서 처리현황을 볼 수 있어요.
            </p>
          </div>
        ) : (
          feedbacks.map((feedback) => {
            const meta = getStatusMeta(feedback.status);
            const StatusIcon = meta.icon;

            return (
              <div key={feedback.id} className="rounded-3xl border border-border bg-white p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{feedback.categoryName}</p>
                    <h2 className="mt-1 text-lg">{feedback.title}</h2>
                  </div>
                  <Badge className={meta.className}>
                    <StatusIcon className="mr-1 h-3.5 w-3.5" />
                    {meta.label}
                  </Badge>
                </div>

                <p className="mb-4 whitespace-pre-wrap text-sm text-muted-foreground">{feedback.body}</p>

                {feedback.imageUrls.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>첨부 이미지 {feedback.imageUrls.length}장</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {feedback.imageUrls.map((imageUrl, index) => (
                        <img
                          key={`${feedback.id}-${index}`}
                          src={imageUrl}
                          alt={`피드백 첨부 ${index + 1}`}
                          className="aspect-square rounded-2xl object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">최근 상태 변경</span>
                    <span>{formatDate(feedback.updatedAt ?? feedback.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm">{getStatusDescription(feedback.status)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
