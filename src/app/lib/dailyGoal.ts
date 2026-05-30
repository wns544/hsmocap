export const DAILY_GOAL_STORAGE_KEY = "wordy.daily-goal";
export const DAILY_GOAL_OPTIONS = [5, 10, 20, 30, 50] as const;
export const DEFAULT_DAILY_GOAL = 20;

export function isDailyGoalOption(value: number): value is (typeof DAILY_GOAL_OPTIONS)[number] {
  return DAILY_GOAL_OPTIONS.includes(value as (typeof DAILY_GOAL_OPTIONS)[number]);
}

export function readStoredDailyGoal() {
  if (typeof window === "undefined") {
    return DEFAULT_DAILY_GOAL;
  }

  const value = Number(window.localStorage.getItem(DAILY_GOAL_STORAGE_KEY));
  return isDailyGoalOption(value) ? value : DEFAULT_DAILY_GOAL;
}

export function writeStoredDailyGoal(goal: number) {
  if (typeof window === "undefined" || !isDailyGoalOption(goal)) {
    return;
  }

  window.localStorage.setItem(DAILY_GOAL_STORAGE_KEY, String(goal));
}

export function limitToStoredDailyGoal<T>(items: T[]) {
  return items.slice(0, readStoredDailyGoal());
}
