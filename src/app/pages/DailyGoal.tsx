import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronLeft, Target } from "lucide-react";

import { Button } from "../components/ui/button";
import { DAILY_GOAL_OPTIONS, DEFAULT_DAILY_GOAL, readStoredDailyGoal, writeStoredDailyGoal } from "../lib/dailyGoal";

export default function DailyGoal() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState(DEFAULT_DAILY_GOAL);

  useEffect(() => {
    setSelectedGoal(readStoredDailyGoal());
  }, []);

  const handleSelectGoal = (goal: number) => {
    setSelectedGoal(goal);
    writeStoredDailyGoal(goal);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-white border-b border-border px-6 pt-12 pb-6">
        <button
          onClick={() => navigate("/app/settings")}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 hover:bg-muted"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl">일일 학습 목표</h1>
            <p className="mt-1 text-muted-foreground">하루에 학습할 단어 수를 정해 보세요.</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-3">
        {DAILY_GOAL_OPTIONS.map((goal) => {
          const isSelected = selectedGoal === goal;

          return (
            <button
              key={goal}
              onClick={() => handleSelectGoal(goal)}
              className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-colors ${
                isSelected ? "border-primary bg-primary/5" : "border-border bg-white active:bg-muted/30"
              }`}
            >
              <div>
                <div className="text-lg">{goal}개</div>
                <div className="text-sm text-muted-foreground">하루 목표 단어 수</div>
              </div>
              {isSelected ? <Check className="h-5 w-5 text-primary" /> : null}
            </button>
          );
        })}

        <Button onClick={() => navigate("/app/settings")} className="mt-6 h-14 w-full rounded-xl">
          저장하고 돌아가기
        </Button>
      </div>
    </div>
  );
}
