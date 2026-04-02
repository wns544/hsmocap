import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Settings, Volume2, Play, BookOpen, CheckCircle, AlertCircle, Trophy, RefreshCw, Home, Delete, ImageIcon, X as XIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion, AnimatePresence } from "motion/react";

interface QuizQuestion {
  id: number;
  korean: string;
  english: string;
  targetWord: string;
  wordMeaning: string;
  pronunciation?: string;
  koreanTargetWord: string;
  acceptableAnswers: string[];
}

interface FeedbackData {
  isCorrect: boolean;
  message: string;
  hint?: string;
}

// 즐겨찾기 단어들만 포함된 문제
const favoriteQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    korean: "그녀의 연설은 매우 웅변적이었다.",
    english: "Her speech was very eloquent.",
    targetWord: "eloquent",
    wordMeaning: "웅변적인",
    pronunciation: "ˈɛləkwənt",
    koreanTargetWord: "웅변적이었다",
    acceptableAnswers: ["웅변적이었다", "설득력 있었다", "유창했다"],
  },
  {
    id: 2,
    korean: "그는 어려운 사람들에게 연민을 보였다.",
    english: "He showed compassion to those in need.",
    targetWord: "compassion",
    wordMeaning: "연민",
    pronunciation: "kəmˈpæʃən",
    koreanTargetWord: "연민",
    acceptableAnswers: ["연민", "동정심", "측은지심"],
  },
  {
    id: 3,
    korean: "정원에는 풍부한 꽃들이 있다.",
    english: "The garden has abundant flowers.",
    targetWord: "abundant",
    wordMeaning: "풍부한",
    pronunciation: "əˈbʌndənt",
    koreanTargetWord: "풍부한",
    acceptableAnswers: ["풍부한", "많은", "넘쳐나는"],
  },
  {
    id: 4,
    korean: "그 책을 찾은 것은 순전히 뜻밖의 행운이었다.",
    english: "Finding that book was pure serendipity.",
    targetWord: "serendipity",
    wordMeaning: "뜻밖의 행운",
    pronunciation: "ˌsɛrənˈdɪpəti",
    koreanTargetWord: "뜻밖의 행운",
    acceptableAnswers: ["뜻밖의 행운", "우연한 발견", "세렌디피티"],
  },
  {
    id: 5,
    korean: "그들은 조화로운 관계를 가지고 있다.",
    english: "They have a harmonious relationship.",
    targetWord: "harmonious",
    wordMeaning: "조화로운",
    pronunciation: "hɑːrˈmoʊniəs",
    koreanTargetWord: "조화로운",
    acceptableAnswers: ["조화로운", "화목한", "평화로운"],
  },
];

export default function SentenceFavorites() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showFeedback, setShowFeedback] = useState<FeedbackData | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showImageHint, setShowImageHint] = useState(false);
  const [hintImageUrl, setHintImageUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = favoriteQuizQuestions[currentIndex];
  const totalQuestions = favoriteQuizQuestions.length;
  const progress = ((completedCount) / totalQuestions) * 100;

  // 입력 필드에 자동으로 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  // 한국어 문장에서 타겟 단어를 ???로 대체
  const renderKoreanSentence = () => {
    if (!currentQuestion) return null;

    const { korean, koreanTargetWord } = currentQuestion;
    const parts = korean.split(koreanTargetWord);

    return (
      <h2 className="text-2xl mb-2 flex items-center flex-wrap gap-1">
        {parts[0]}
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="inline-flex items-center justify-center min-w-[60px] h-10 px-3 border-2 border-gray-300 rounded-lg bg-white text-gray-800 font-normal text-xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-200"
          placeholder=""
          ref={inputRef}
        />
        {parts[1]}
      </h2>
    );
  };

  // 문장에서 타겟 단어 하이라이트
  const renderHighlightedSentence = () => {
    if (!currentQuestion) return null;

    const { english, targetWord } = currentQuestion;
    const parts = english.split(new RegExp(`(\\b${targetWord}\\b)`, "gi"));

    return (
      <p className="text-2xl leading-relaxed text-gray-800">
        {parts.map((part, index) => {
          if (part.toLowerCase() === targetWord.toLowerCase()) {
            return (
              <span key={index} className="bg-cyan-100 text-cyan-600 px-2 py-1 rounded-lg font-medium">
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </p>
    );
  };

  // 다음 문제
  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput("");
      setShowFeedback(null);
      setCompletedCount(completedCount + 1);
    } else {
      setCompletedCount(totalQuestions);
      setIsCompleted(true);
    }
  };

  // 다시 학습하기
  const handleRestart = () => {
    setCurrentIndex(0);
    setCompletedCount(0);
    setCorrectCount(0);
    setWrongCount(0);
    setIsCompleted(false);
    setUserInput("");
    setShowFeedback(null);
  };

  // AI 스타일 피드백 생성 함수
  const generateFeedback = (userAnswer: string, correctAnswer: string, question: QuizQuestion): FeedbackData => {
    const trimmedUser = userAnswer.trim();
    const trimmedCorrect = correctAnswer.trim();

    // 정답인 경우
    if (question.acceptableAnswers.includes(trimmedUser)) {
      const correctMessages = [
        `완벽합니다! '${question.targetWord}'는 '${question.wordMeaning}'라는 의미로, 이 문맥에서 "${trimmedCorrect}"가 정확한 번역입니다.`,
        `정답입니다! 영어 '${question.targetWord}'를 한국어로 '${trimmedCorrect}'라고 표현하는 것이 자연스럽습니다.`,
        `맞았어요! 이 문장에서 '${question.targetWord}'는 '${trimmedCorrect}'로 번역되어 문맥상 완벽하게 맞습니다.`,
      ];
      setCorrectCount(correctCount + 1);
      return {
        isCorrect: true,
        message: correctMessages[Math.floor(Math.random() * correctMessages.length)],
      };
    }

    // 오답인 경우
    const similarity = calculateSimilarity(trimmedUser, trimmedCorrect);
    
    if (similarity > 0.7) {
      setWrongCount(wrongCount + 1);
      return {
        isCorrect: false,
        message: `아쉽네요! 거의 다 맞았어요.`,
        hint: `'${question.targetWord}'는 '${question.wordMeaning}'라는 뜻입니다. 정답은 '${trimmedCorrect}'입니다. 문법이나 형태를 다시 확인해보세요!`,
      };
    } else if (trimmedUser.length === 0) {
      setWrongCount(wrongCount + 1);
      return {
        isCorrect: false,
        message: `답을 입력해주세요!`,
        hint: `'${question.targetWord}'의 의미는 '${question.wordMeaning}'입니다. 이 단어가 문장에서 어떻게 쓰이는지 생각해보세요.`,
      };
    } else {
      setWrongCount(wrongCount + 1);
      return {
        isCorrect: false,
        message: `틀렸습니다. 다시 생각해보세요!`,
        hint: `'${question.targetWord}'는 '${question.wordMeaning}'를 의미합니다. 한국어 문장의 맥락을 고려해서 적절한 형태로 변환해보세요.`,
      };
    }
  };

  // 문자열 유사도 계산
  const calculateSimilarity = (str1: string, str2: string): number => {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator,
        );
      }
    }
    const distance = track[str2.length][str1.length];
    return 1 - distance / Math.max(str1.length, str2.length);
  };

  // 모르겠음
  const handleDontKnow = () => {
    setUserInput(currentQuestion.koreanTargetWord);
    setShowFeedback({ 
      isCorrect: false, 
      message: "정답을 확인하세요!", 
      hint: `'${currentQuestion.targetWord}'는 '${currentQuestion.wordMeaning}'라는 의미입니다. 다음에는 꼭 기억해보세요!`,
    });
  };

  // 발음 듣기
  const handlePronunciation = () => {
    const utterance = new SpeechSynthesisUtterance(currentQuestion.english);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // 이미지 힌트 보기
  const handleImageHint = async () => {
    const imageQuery = currentQuestion.targetWord;
    const imageUrl = `https://source.unsplash.com/400x400/?${imageQuery}`;
    setHintImageUrl(imageUrl);
    setShowImageHint(true);
  };

  // 정답 제출
  const handleSubmit = () => {
    const trimmedInput = userInput.trim();
    const correctAnswer = currentQuestion.koreanTargetWord.trim();
    
    const feedback = generateFeedback(trimmedInput, correctAnswer, currentQuestion);
    setShowFeedback(feedback);

    if (feedback.isCorrect) {
      setTimeout(() => {
        handleNext();
      }, 1000);
    }
  };

  // 키보드 키 입력
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setUserInput(userInput.slice(0, -1));
    } else if (key === 'space') {
      setUserInput(userInput + ' ');
    } else {
      setUserInput(userInput + key);
    }
  };

  // 한글 자판 레이아웃
  const koreanKeyboard = [
    ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
    ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isCompleted ? (
        <>
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/favorites")}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Progress */}
            <div className="flex items-center gap-3 flex-1 mx-4">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full p-2">
                <span className="text-white text-xs font-bold">
                  ⭐ {completedCount}/{totalQuestions}
                </span>
              </div>
              <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-start px-6 pt-16 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full max-w-lg"
              >
                {/* Question Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
                  {/* English Sentence */}
                  <div className="mb-8">
                    {renderHighlightedSentence()}
                  </div>

                  {/* Korean Sentence */}
                  <div className="mb-6">
                    {renderKoreanSentence()}
                  </div>
                </div>

                {/* Action Buttons - 3개 버튼 */}
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
                    onClick={handleImageHint}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm font-semibold">이미지 힌트</span>
                  </button>

                  <button 
                    onClick={handleSubmit}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Play className="w-6 h-6" />
                    <span className="text-sm font-semibold">정답제출</span>
                  </button>
                </div>

                {/* Feedback */}
                {showFeedback && (
                  <div
                    className={`mb-4 p-4 rounded-3xl ${
                      showFeedback.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
                    {showFeedback.hint && (
                      <p className="mt-2 text-sm text-gray-600">힌트: {showFeedback.hint}</p>
                    )}
                  </div>
                )}

                {/* Virtual Keyboard */}
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
                  {/* Bottom row with space and backspace */}
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => handleKeyPress('backspace')}
                      className="bg-white text-gray-800 font-medium px-4 py-3 rounded-lg shadow hover:bg-gray-100 active:bg-gray-300 transition-colors flex items-center justify-center"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleKeyPress('space')}
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
        /* Results Screen */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            {/* Trophy Icon */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-8 shadow-2xl">
                <Trophy className="w-20 h-20 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
              즐겨찾기 학습 완료!
            </h1>
            <p className="text-center text-gray-600 mb-8">⭐ 즐겨찾기 단어를 모두 학습했습니다! 🎉</p>

            {/* Stats Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* 총 문제 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{totalQuestions}</div>
                  <div className="text-sm text-gray-500">총 문제</div>
                </div>

                {/* 정답 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">{correctCount}</div>
                  <div className="text-sm text-gray-500">정답</div>
                </div>

                {/* 오답 */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-1">{wrongCount}</div>
                  <div className="text-sm text-gray-500">오답</div>
                </div>
              </div>

              {/* 정답률 */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-semibold">정답률</span>
                  <span className="text-2xl font-bold text-green-600">
                    {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0}%` 
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRestart}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold">다시 학습</span>
              </button>

              <button
                onClick={() => navigate("/app/favorites")}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <Home className="w-5 h-5" />
                <span className="font-semibold">즐겨찾기로</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Image Hint Modal */}
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
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowImageHint(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <XIcon className="w-5 h-5 text-gray-600" />
              </button>

              {/* Title */}
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                {currentQuestion?.targetWord}
              </h3>

              {/* Image */}
              <div className="rounded-2xl overflow-hidden bg-gray-100 mb-4">
                <img
                  src={hintImageUrl}
                  alt={currentQuestion?.targetWord}
                  className="w-full h-64 object-cover"
                  key={hintImageUrl}
                />
              </div>

              {/* Hint Text */}
              <p className="text-sm text-gray-500 text-center">
                💡 이미지를 보고 단어의 의미를 떠올려보세요!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}