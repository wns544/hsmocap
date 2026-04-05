import seedWordsJson from "./seedWords.json";

export interface SeedWord {
  word: string;
  meaning: string;
  level: "초급" | "중급" | "고급";
  frequency: number;
  frequencyRank: number;
  exampleSentence: string;
  exampleTranslation: string;
  quizKoreanBlank: string;
  quizAnswers: string[];
}

export const seedWords = seedWordsJson as SeedWord[];
