export const studyLevels = ["전체", "초급", "중급", "고급", "비즈니스"] as const;

export type StudyLevel = (typeof studyLevels)[number];

export const STUDY_LEVEL_STORAGE_KEY = "wordy.studyLevel";

export function getStoredStudyLevel(): StudyLevel {
  if (typeof window === "undefined") {
    return "전체";
  }

  const storedValue = window.localStorage.getItem(STUDY_LEVEL_STORAGE_KEY);
  return studyLevels.includes(storedValue as StudyLevel) ? (storedValue as StudyLevel) : "전체";
}

export function setStoredStudyLevel(level: StudyLevel) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STUDY_LEVEL_STORAGE_KEY, level);
}
