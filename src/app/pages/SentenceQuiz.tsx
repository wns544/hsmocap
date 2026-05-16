import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Delete,
  Home,
  ImageIcon,
  Play,
  RefreshCw,
  Settings,
  Trophy,
  Volume2,
  X as XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { auth, db } from "../lib/firebase";
import { shuffleArray } from "../lib/random";
import { getStoredStudyLevel } from "../lib/studyPreferences";
import { recordCorrectAnswer, recordStudySessionCompletion, recordWrongAnswer } from "../lib/studyProgress";
import { getWordProgress, upsertWordProgress } from "../lib/wordProgresses";
import { isQuizWordUsable, normalizeQuizWordDocs, resolveQuizCorrectAnswer } from "../lib/wordsAdapter";

const REVIEW_QUEUE_STORAGE_KEY = "review-queue-word-ids";

function clearReviewQueueStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(REVIEW_QUEUE_STORAGE_KEY);
}

interface QuizQuestion {
  id: number;
  korean: string;
  english: string;
  targetWord: string;
  wordMeaning: string;
  level?: string;
  pronunciation?: string;
  koreanTargetWord: string;
  acceptableAnswers: string[];
}

interface FeedbackData {
  isCorrect: boolean;
  tone?: "success" | "close" | "error";
  message: string;
  hint?: string;
}

interface GradeWordAnswerResponse {
  isCorrect: boolean;
  verdict: "correct" | "correct_but_unnatural" | "close" | "incorrect" | "empty";
  message: string;
  hint?: string;
  matchedAnswer?: string;
}

interface CommonsImageResult {
  imageUrl: string;
  descriptionUrl: string;
  title: string;
}

const GRADE_WORD_ANSWER_URL =
  import.meta.env.VITE_GRADE_WORD_ANSWER_URL ??
  "https://asia-northeast3-hsmocap-d907e.cloudfunctions.net/gradeWordAnswerHttp";

const IMAGE_HINT_URL =
  import.meta.env.VITE_IMAGE_HINT_URL ??
  "https://asia-northeast3-hsmocap-d907e.cloudfunctions.net/imageHintSearchHttp";

const ALL_LEVEL = "전체";

const fallbackQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    korean: "나는 어제 학교에 갔다.",
    english: "I went to school yesterday.",
    targetWord: "went",
    wordMeaning: "갔다",
    level: "초급",
    koreanTargetWord: "갔다",
    acceptableAnswers: ["갔다", "갔어"],
  },
  {
    id: 2,
    korean: "우리는 원인에 집중해야 한다.",
    english: "We need to zero in on the cause.",
    targetWord: "zero in on",
    wordMeaning: "집중 공략하다",
    level: "고급",
    koreanTargetWord: "집중해야 한다",
    acceptableAnswers: ["집중해야 한다", "집중해야 해", "집중하다", "초점을 맞추다"],
  },
  {
    id: 3,
    korean: "그녀는 아주 아름다운 목소리를 가졌다.",
    english: "She has a beautiful voice.",
    targetWord: "beautiful",
    wordMeaning: "아름다운",
    level: "초급",
    koreanTargetWord: "아름다운",
    acceptableAnswers: ["아름다운", "예쁜", "고운"],
  },
];

const koreanKeyboard = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

const isLowQualityCommonsResult = (title: string, imageUrl: string) => {
  const value = `${title} ${imageUrl}`.toLowerCase();
  return [
    ".pdf",
    ".djvu",
    "analysis",
    "article",
    "book",
    "chart",
    "cost benefit",
    "cost-benefit",
    "diagram",
    "thesis",
    "dissertation",
    "document",
    "ebook",
    "graph",
    "handwriting",
    "infographic",
    "journal",
    "manuscript",
    "newspaper",
    "notebook",
    "page",
    "paper",
    "book cover",
    "cover page",
    "presentation",
    "receipt",
    "report",
    "scan",
    "screenshot",
    "slide",
    "spreadsheet",
    "table",
    "text",
    "logo",
    "website",
    "whiteboard",
    "worksheet",
  ].some((term) => value.includes(term));
};

const searchCommonsImage = async (queryWord: string): Promise<CommonsImageResult | null> => {
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  endpoint.searchParams.set("action", "query");
  endpoint.searchParams.set("generator", "search");
  endpoint.searchParams.set(
    "gsrsearch",
    `${queryWord} photo -pdf -document -thesis -dissertation -book -scan -logo -text -chart -diagram`,
  );
  endpoint.searchParams.set("gsrnamespace", "6");
  endpoint.searchParams.set("gsrlimit", "5");
  endpoint.searchParams.set("prop", "imageinfo|info");
  endpoint.searchParams.set("iiprop", "url");
  endpoint.searchParams.set("iiurlwidth", "640");
  endpoint.searchParams.set("inprop", "url");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("formatversion", "2");
  endpoint.searchParams.set("origin", "*");

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    throw new Error(`Wikimedia Commons request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    query?: {
      pages?: Array<{
        title?: string;
        fullurl?: string;
        imageinfo?: Array<{
          thumburl?: string;
          url?: string;
        }>;
      }>;
    };
  };

  const page = data.query?.pages?.find((candidate) => {
    const imageInfo = candidate.imageinfo?.[0];
    const imageUrl = imageInfo?.thumburl || imageInfo?.url || "";
    return !!candidate.title && !!imageUrl && !isLowQualityCommonsResult(candidate.title, imageUrl);
  });
  const imageInfo = page?.imageinfo?.[0];
  const imageUrl = imageInfo?.thumburl || imageInfo?.url;
  const descriptionUrl = page?.fullurl;

  if (!page?.title || !imageUrl || !descriptionUrl) {
    return null;
  }

  return {
    imageUrl,
    descriptionUrl,
    title: page.title,
  };
};

const calculateSimilarity = (source: string, target: string): number => {
  const sourceLength = source.length;
  const targetLength = target.length;
  const matrix = Array.from({ length: targetLength + 1 }, () => Array(sourceLength + 1).fill(0));

  for (let index = 0; index <= sourceLength; index += 1) {
    matrix[0][index] = index;
  }

  for (let index = 0; index <= targetLength; index += 1) {
    matrix[index][0] = index;
  }

  for (let row = 1; row <= targetLength; row += 1) {
    for (let column = 1; column <= sourceLength; column += 1) {
      const cost = source[column - 1] === target[row - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  const distance = matrix[targetLength][sourceLength];
  return 1 - distance / Math.max(sourceLength, targetLength, 1);
};

const createLocalFeedback = (
  userAnswer: string,
  correctAnswer: string,
  question: QuizQuestion,
): FeedbackData => {
  const trimmedUser = userAnswer.trim();
  const trimmedCorrect = correctAnswer.trim();

  if (question.acceptableAnswers.includes(trimmedUser)) {
    return {
      isCorrect: true,
      tone: "success",
      message: `정답입니다. '${question.targetWord}'는 이 문장에서 '${trimmedCorrect}'로 쓰입니다.`,
    };
  }

  if (trimmedUser.length === 0) {
    return {
      isCorrect: false,
      tone: "error",
      message: "답을 입력해 주세요.",
      hint: `'${question.targetWord}'의 의미는 '${question.wordMeaning}'입니다.`,
    };
  }

  const similarity = calculateSimilarity(trimmedUser, trimmedCorrect);
  if (similarity > 0.7) {
    return {
      isCorrect: false,
      tone: "close",
      message: "거의 맞았어요.",
      hint: `더 자연스러운 정답은 '${trimmedCorrect}'입니다.`,
    };
  }

  return {
    isCorrect: false,
    tone: "error",
    message: "다시 생각해 보세요.",
    hint: `'${question.targetWord}'의 의미는 '${question.wordMeaning}'이고, 정답은 '${trimmedCorrect}'입니다.`,
  };
};

const mapServerFeedback = (feedback: GradeWordAnswerResponse): FeedbackData => ({
  isCorrect: feedback.verdict === "correct" || feedback.verdict === "correct_but_unnatural",
  tone:
    feedback.verdict === "close"
      ? "close"
      : feedback.verdict === "correct" || feedback.verdict === "correct_but_unnatural"
        ? "success"
        : "error",
  message: feedback.message,
  hint: feedback.hint,
});

export default function SentenceQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(fallbackQuizQuestions);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [showFeedback, setShowFeedback] = useState<FeedbackData | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showImageHint, setShowImageHint] = useState(false);
  const [hintImageUrl, setHintImageUrl] = useState("");
  const [hintImageSourceUrl, setHintImageSourceUrl] = useState("");
  const [hintImageTitle, setHintImageTitle] = useState("");
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didRevealAnswerForCurrentQuestion, setDidRevealAnswerForCurrentQuestion] = useState(false);
  const [sourceQuestions, setSourceQuestions] = useState<QuizQuestion[]>([]);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const selectedStudyLevel = searchParams.get("level") || getStoredStudyLevel();
  const reviewMode = searchParams.get("mode") === "review";

  const currentQuestion = quizQuestions[currentIndex] ?? null;
  const totalQuestions = quizQuestions.length;
  const progress = totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  useEffect(() => {
    const loadQuizQuestions = async () => {
      try {
        const wordsQuery = query(collection(db, "words"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(wordsQuery);

        const firestoreQuestionCandidates = normalizeQuizWordDocs(snapshot.docs)
          .filter(isQuizWordUsable)
          .map((item, index) => ({
            id: index + 1,
            korean: item.exampleTranslation,
            english: item.exampleSentence,
            targetWord: item.word,
            wordMeaning: item.meaning,
            level: item.level,
            koreanTargetWord: resolveQuizCorrectAnswer(item),
            acceptableAnswers: item.quizAnswers,
          }));

        const firestoreQuestions = reviewMode
          ? firestoreQuestionCandidates
          : firestoreQuestionCandidates.filter((question) => {
              if (selectedStudyLevel === ALL_LEVEL) {
                return true;
              }

              return question.level === selectedStudyLevel;
            });

        const fallbackQuestions =
          reviewMode || selectedStudyLevel === ALL_LEVEL
            ? fallbackQuizQuestions
            : fallbackQuizQuestions.filter((question) => question.level === selectedStudyLevel);

        let nextQuestions =
          firestoreQuestions.length > 0
            ? firestoreQuestions
            : fallbackQuestions.length > 0
              ? fallbackQuestions
              : fallbackQuizQuestions;

        if (reviewMode && typeof window !== "undefined") {
          const rawQueue = window.sessionStorage.getItem(REVIEW_QUEUE_STORAGE_KEY);
          const reviewQueue = rawQueue ? (JSON.parse(rawQueue) as string[]) : [];
          const reviewTargets = new Set(reviewQueue.map((item) => item.toLowerCase()));
          const reviewQuestionMap = new Map(
            [...fallbackQuizQuestions, ...firestoreQuestionCandidates].map((question) => [
              question.targetWord.toLowerCase(),
              question,
            ]),
          );
          nextQuestions = reviewQueue
            .map((word) => reviewQuestionMap.get(word.toLowerCase()))
            .filter((question): question is QuizQuestion => !!question)
            .filter((question) => reviewTargets.has(question.targetWord.toLowerCase()));
        }

        setSourceQuestions(nextQuestions);
        setQuizQuestions(shuffleArray(nextQuestions));
        setCurrentIndex(0);
        setCompletedCount(0);
        setCorrectCount(0);
        setWrongCount(0);
        setIsCompleted(false);
        setUserInput("");
        setShowFeedback(null);
        setCompletionRecorded(false);
      } catch (error) {
        console.error("문장 퀴즈 데이터를 불러오지 못했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadQuizQuestions();
  }, [reviewMode, selectedStudyLevel]);

  useEffect(() => {
    if (!reviewMode || !isCompleted) {
      return;
    }

    clearReviewQueueStorage();
  }, [isCompleted, reviewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    if (!isCompleted || completionRecorded) {
      return;
    }

    recordStudySessionCompletion({
      correctCount,
      wrongCount,
    });
    setCompletionRecorded(true);
  }, [completionRecorded, correctCount, isCompleted, wrongCount]);

  useEffect(() => {
    setDidRevealAnswerForCurrentQuestion(false);
  }, [currentQuestion?.id]);

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((value) => value + 1);
      setUserInput("");
      setShowFeedback(null);
      setCompletedCount((value) => value + 1);
      return;
    }

    setCompletedCount(totalQuestions);
    setIsCompleted(true);
  };

  const persistCurrentQuestionProgress = async (result: "correct" | "wrong") => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentQuestion) {
      return;
    }

    try {
      const existing = await getWordProgress(currentUser.uid, currentQuestion.targetWord);
      const now = new Date();
      const existingStage = existing?.currentStage ?? 0;
      const getNextReviewAt = (stage: number) => {
        const next = new Date(now);

        if (stage <= 1) {
          next.setDate(next.getDate() + 1);
          return next;
        }

        if (stage === 2) {
          next.setDate(next.getDate() + 3);
          return next;
        }

        if (stage === 3) {
          next.setDate(next.getDate() + 7);
          return next;
        }

        return null;
      };

      const nextStage =
        result === "correct"
          ? Math.min(Math.max(existingStage, 1) + (reviewMode ? 1 : 0), 4)
          : 1;
      const nextStatus =
        result === "wrong"
          ? "REVIEW"
          : nextStage >= 4
            ? "MASTERED"
            : nextStage >= 2
              ? "REVIEW"
              : "LEARNING";
      const nextReviewAt =
        result === "wrong"
          ? getNextReviewAt(1)
          : nextStage >= 4
            ? null
            : getNextReviewAt(nextStage);

      await upsertWordProgress({
        uid: currentUser.uid,
        wordId: currentQuestion.targetWord,
        status: nextStatus,
        currentStage: nextStage,
        totalAnswerCount: (existing?.totalAnswerCount ?? 0) + 1,
        correctAnswerCount: (existing?.correctAnswerCount ?? 0) + (result === "correct" ? 1 : 0),
        lastReviewedAt: now,
        nextReviewAt,
        lastResult: result,
      });
    } catch (error) {
      console.error("[Word Progress Save Error]", error);
    }
  };

  const applyCorrectResult = () => {
    if (!currentQuestion) {
      return;
    }

    const reward = recordCorrectAnswer({
      wordId: currentQuestion.targetWord,
      word: currentQuestion.targetWord,
      level: currentQuestion.level,
    });

    setCorrectCount((value) => value + 1);
    void persistCurrentQuestionProgress("correct");
    toast.success(`+${reward.rewardXp} XP`, {
      description: `${currentQuestion.targetWord} 정답 보상`,
    });
  };

  const applyWrongResult = () => {
    if (!currentQuestion) {
      return;
    }

    setWrongCount((value) => value + 1);
    recordWrongAnswer({
      wordId: currentQuestion.targetWord,
      word: currentQuestion.targetWord,
      level: currentQuestion.level,
    });
    void persistCurrentQuestionProgress("wrong");
  };

  const applyLocalFallback = (userAnswer: string, correctAnswer: string) => {
    if (!currentQuestion) {
      return;
    }

    const feedback = createLocalFeedback(userAnswer, correctAnswer, currentQuestion);
    setShowFeedback(feedback);

    if (feedback.isCorrect) {
      applyCorrectResult();
      window.setTimeout(() => {
        handleNext();
      }, 1000);
      return;
    }

    applyWrongResult();
  };

  const renderKoreanSentence = () => {
    if (!currentQuestion) {
      return null;
    }

    const parts = currentQuestion.korean.split(currentQuestion.koreanTargetWord);

    return (
      <h2 className="text-2xl mb-2 flex items-center flex-wrap gap-1">
        {parts[0]}
        <input
          type="text"
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || isComposing) {
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          enterKeyHint="done"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="inline-flex items-center justify-center min-w-[60px] h-10 px-3 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-normal text-xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200"
          placeholder=""
        />
        {parts[1]}
      </h2>
    );
  };

  const renderHighlightedSentence = () => {
    if (!currentQuestion) {
      return null;
    }

    const parts = currentQuestion.english.split(new RegExp(`(\\b${currentQuestion.targetWord}\\b)`, "gi"));

    return (
      <p className="text-2xl leading-relaxed text-gray-800">
        {parts.map((part, index) =>
          part.toLowerCase() === currentQuestion.targetWord.toLowerCase() ? (
            <span key={`${part}-${index}`} className="bg-cyan-100 text-cyan-600 px-2 py-1 rounded-lg font-medium">
              {part}
            </span>
          ) : (
            <span key={`${part}-${index}`}>{part}</span>
          ),
        )}
      </p>
    );
  };

  const handleRestart = () => {
    setQuizQuestions(shuffleArray(sourceQuestions.length > 0 ? sourceQuestions : quizQuestions));
    setCurrentIndex(0);
    setCompletedCount(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsCompleted(false);
    setUserInput("");
    setShowFeedback(null);
    setCompletionRecorded(false);
  };

  const handleDontKnow = () => {
    if (!currentQuestion) {
      return;
    }

    if (!showFeedback && !didRevealAnswerForCurrentQuestion) {
      applyWrongResult();
      setDidRevealAnswerForCurrentQuestion(true);
    }

    setUserInput(currentQuestion.koreanTargetWord);
    setShowFeedback({
      isCorrect: false,
      tone: "error",
      message: "정답을 확인해 보세요.",
      hint: `'${currentQuestion.targetWord}'의 의미는 '${currentQuestion.wordMeaning}'입니다. 다음에는 꼭 기억해 보세요!`,
    });
  };

  const handlePronunciation = () => {
    if (!currentQuestion) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentQuestion.english);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleImageHint = async () => {
    if (!currentQuestion) {
      return;
    }

    setIsHintLoading(true);
    setHintImageUrl("");
    setHintImageSourceUrl("");
    setHintImageTitle("");
    setShowImageHint(true);

    try {
      let result: CommonsImageResult | null = null;

      try {
        const response = await fetch(IMAGE_HINT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetWord: currentQuestion.targetWord,
            english: currentQuestion.english,
            wordMeaning: currentQuestion.wordMeaning,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as Partial<CommonsImageResult>;
          if (data.imageUrl && data.descriptionUrl && data.title) {
            result = {
              imageUrl: data.imageUrl,
              descriptionUrl: data.descriptionUrl,
              title: data.title,
            };
          }
        } else {
          console.error("[Image Hint Error]", response.status);
        }
      } catch (error) {
        console.error("[Image Hint Error]", error);
      }

      if (!result) {
        result = await searchCommonsImage(currentQuestion.targetWord);
      }

      if (!result) {
        toast.error(`'${currentQuestion.targetWord}'에 맞는 이미지 힌트를 찾지 못했습니다.`);
        setShowImageHint(false);
        return;
      }

      setHintImageUrl(result.imageUrl);
      setHintImageSourceUrl(result.descriptionUrl);
      setHintImageTitle(result.title);
    } catch (error) {
      console.error("[Image Hint Error]", error);
      toast.error("이미지 힌트를 불러오지 못했습니다.");
      setShowImageHint(false);
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || isSubmitting) {
      return;
    }

    const trimmedInput = userInput.trim();
    const correctAnswer = currentQuestion.koreanTargetWord.trim();

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const token = currentUser ? await getIdToken(currentUser, false) : "";

      if (!token) {
        console.error("[No Auth Token]");
        toast.error("로그인 정보가 필요합니다. 다시 로그인해 주세요.");
        return;
      }

      const response = await fetch(GRADE_WORD_ANSWER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          english: currentQuestion.english,
          korean: currentQuestion.korean,
          targetWord: currentQuestion.targetWord,
          wordMeaning: currentQuestion.wordMeaning,
          acceptableAnswers: currentQuestion.acceptableAnswers,
          correctAnswer,
          userAnswer: trimmedInput,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        console.error("[Grade Auth Error]", response.status);
        toast.error("인증 정보가 올바르지 않습니다. 다시 로그인해 주세요.");
        return;
      }

      if (response.status === 400) {
        const errorText = await response.text();
        console.error("[Grade Bad Request]", errorText);
        toast.error("채점 요청 형식에 문제가 있습니다.");
        return;
      }

      if (!response.ok) {
        if (response.status >= 500) {
          console.error("[Grade Server Error]", response.status);
          toast.error("서버 채점에 실패해 기본 채점으로 전환합니다.");
          applyLocalFallback(trimmedInput, correctAnswer);
          return;
        }

        console.error("[Grade Error]", response.status);
        toast.error("채점 요청을 처리하지 못했습니다.");
        return;
      }

      const feedback = (await response.json()) as GradeWordAnswerResponse;
      setShowFeedback(mapServerFeedback(feedback));

      if (feedback.verdict === "correct" || feedback.verdict === "correct_but_unnatural") {
        applyCorrectResult();
        window.setTimeout(() => {
          handleNext();
        }, feedback.verdict === "correct" ? 1000 : 1600);
        return;
      }

      if (feedback.verdict === "close" || feedback.verdict === "incorrect" || feedback.verdict === "empty") {
        applyWrongResult();
      }
    } catch (error) {
      console.error("[Grade Network Error]", error);
      toast.error("서버 채점에 실패해 기본 채점으로 전환합니다.");
      applyLocalFallback(trimmedInput, correctAnswer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === "backspace") {
      setUserInput((value) => value.slice(0, -1));
      return;
    }

    if (key === "space") {
      setUserInput((value) => value + " ");
      return;
    }

    setUserInput((value) => value + key);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-2">문장 퀴즈를 준비하고 있습니다.</p>
          <p className="text-sm text-gray-500">Firestore의 `words` 문장 데이터를 확인하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-lg text-gray-700 mb-2">
            {reviewMode
              ? "지금 바로 복습할 단어가 없습니다."
              : "문장 퀴즈에 사용할 데이터가 없습니다."}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {reviewMode
              ? "문장 퀴즈에서 오답이나 약한 단어를 더 만든 뒤 다시 복습 목록을 확인해보세요."
              : "`words` 문서에 `exampleSentence`, `exampleTranslation`, `quizKoreanBlank`, `quizAnswers` 필드를 넣어 주세요."}
          </p>
          <Button
            onClick={() => navigate(reviewMode ? "/app/review" : "/app/words")}
            className="rounded-xl"
          >
            {reviewMode ? "복습 목록으로" : "단어 목록으로"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isCompleted ? (
        <>
          <div className="bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/home")} className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3 flex-1 mx-4">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2">
                <span className="text-white text-xs font-bold">
                  {completedCount}/{totalQuestions}
                </span>
              </div>
              <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <Button variant="ghost" size="sm" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-start px-6 pt-16 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-lg"
              >
                {reviewMode && (
                  <div className="mb-4 text-center text-sm font-medium text-orange-600">
                    복습 {completedCount + 1}/{totalQuestions}
                  </div>
                )}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
                  <div className="mb-8">{renderHighlightedSentence()}</div>
                  <div className="mb-6">{renderKoreanSentence()}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={handleDontKnow}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <BookOpen className="w-6 h-6" />
                    <span className="text-sm font-semibold">모르겠음</span>
                  </button>

                  <button
                    onClick={handlePronunciation}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Volume2 className="w-6 h-6" />
                    <span className="text-sm font-semibold">발음듣기</span>
                  </button>

                  <button
                    onClick={() => {
                      void handleSubmit();
                    }}
                    disabled={isSubmitting}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60"
                  >
                    <Play className="w-6 h-6" />
                    <span className="text-sm font-semibold">{isSubmitting ? "채점중" : "정답제출"}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    void handleImageHint();
                  }}
                  className="text-xs text-gray-400 hover:text-purple-500 transition-colors mb-4 flex items-center gap-1 mx-auto"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>이미지 힌트</span>
                </button>

                {showFeedback && (
                  <div
                    className={`mb-4 p-4 rounded-3xl ${
                      showFeedback.isCorrect
                        ? "bg-green-100 text-green-800"
                        : showFeedback.tone === "close"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {showFeedback.isCorrect ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="text-sm font-semibold">{showFeedback.message}</span>
                    </div>
                    {showFeedback.hint && <p className="mt-2 text-sm text-gray-600">힌트: {showFeedback.hint}</p>}
                  </div>
                )}

                <div className="bg-gray-200 rounded-3xl p-4 mb-4">
                  {koreanKeyboard.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-1 mb-2">
                      {row.map((key) => (
                        <button
                          key={key}
                          onClick={() => handleKeyPress(key)}
                          className="bg-white text-gray-800 font-medium px-3 py-3 rounded-lg shadow hover:bg-gray-100 active:bg-gray-300 transition-colors min-w-[32px] text-base"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => handleKeyPress("backspace")}
                      className="bg-white text-gray-800 font-medium px-4 py-3 rounded-lg shadow hover:bg-gray-100 active:bg-gray-300 transition-colors flex items-center justify-center"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleKeyPress("space")}
                      className="bg-white text-gray-800 font-medium px-12 py-3 rounded-lg shadow hover:bg-gray-100 active:bg-gray-300 transition-colors flex-1 max-w-[200px]"
                    >
                      스페이스
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-8 shadow-2xl">
                <Trophy className="w-20 h-20 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">학습 완료!</h1>
            <p className="text-center text-gray-600 mb-8">수고하셨어요.</p>

            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{totalQuestions}</div>
                  <div className="text-sm text-gray-500">총 문제</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">{correctCount}</div>
                  <div className="text-sm text-gray-500">정답</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-1">{wrongCount}</div>
                  <div className="text-sm text-gray-500">오답</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-semibold">정답률</span>
                  <span className="text-2xl font-bold text-green-600">
                    {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold">다시 학습</span>
              </button>

              <button
                onClick={() => {
                  clearReviewQueueStorage();
                  navigate("/app/home");
                }}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <Home className="w-5 h-5" />
                <span className="font-semibold">홈으로</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showImageHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
            onClick={() => setShowImageHint(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <button
                onClick={() => setShowImageHint(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-600" />
              </button>

              <h3 className="text-2xl font-bold mb-6 text-gray-800">{currentQuestion.targetWord}</h3>

              <div className="rounded-2xl overflow-hidden bg-gray-100 mb-4 min-h-64 flex items-center justify-center">
                {isHintLoading ? (
                  <p className="text-sm text-gray-500">이미지를 불러오는 중입니다.</p>
                ) : (
                  <img src={hintImageUrl} alt={currentQuestion.targetWord} className="w-full h-64 object-cover" />
                )}
              </div>

              <p className="text-sm text-gray-500 text-center">이미지를 보고 단어의 의미를 떠올려 보세요.</p>
              {!isHintLoading && hintImageSourceUrl && (
                <a
                  href={hintImageSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block text-center text-sm text-blue-600 hover:underline"
                >
                  출처 보기{hintImageTitle ? ` · ${hintImageTitle}` : ""}
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
