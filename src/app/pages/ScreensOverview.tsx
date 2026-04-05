import { useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  LogIn,
  Home,
  BookMarked,
  FileText,
  Brain,
  CheckCircle,
  X,
  Calendar,
  XCircle,
  Heart,
  Settings,
  User,
  Users,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  Layers,
} from "lucide-react";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { seedWords } from "../data/seedWords";

interface Screen {
  id: number;
  name: string;
  path: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

const screens: Screen[] = [
  {
    id: 1,
    name: "온보딩",
    path: "/onboarding",
    description: "앱 소개 및 시작 화면",
    icon: BookOpen,
    category: "인증",
  },
  {
    id: 2,
    name: "로그인",
    path: "/login",
    description: "Google, Facebook 로그인",
    icon: LogIn,
    category: "인증",
  },
  {
    id: 3,
    name: "홈",
    path: "/app/home",
    description: "대시보드 및 학습 현황",
    icon: Home,
    category: "메인",
  },
  {
    id: 4,
    name: "플래시카드 학습",
    path: "/app/flashcard-study",
    description: "데스매치 형식 단어 암기",
    icon: Layers,
    category: "학습",
  },
  {
    id: 5,
    name: "단어 목록",
    path: "/app/words",
    description: "전체 단어 리스트",
    icon: BookMarked,
    category: "학습",
  },
  {
    id: 6,
    name: "단어 상세",
    path: "/app/words/1",
    description: "단어 의미, 예문, 발음",
    icon: FileText,
    category: "학습",
  },
  {
    id: 7,
    name: "퀴즈 시작",
    path: "/app/quiz",
    description: "퀴즈 모드 선택",
    icon: Brain,
    category: "퀴즈",
  },
  {
    id: 8,
    name: "객관식 퀴즈",
    path: "/app/quiz/multiple-choice",
    description: "4지선다형 문제",
    icon: CheckCircle,
    category: "퀴즈",
  },
  {
    id: 9,
    name: "주관식 퀴즈",
    path: "/app/quiz/short-answer",
    description: "직접 입력형 문제",
    icon: X,
    category: "퀴즈",
  },
  {
    id: 10,
    name: "퀴즈 결과",
    path: "/app/quiz/result",
    description: "점수 및 통계",
    icon: CheckCircle,
    category: "퀴즈",
  },
  {
    id: 11,
    name: "복습 리스트",
    path: "/app/review",
    description: "복습이 필요한 단어",
    icon: Calendar,
    category: "복습",
  },
  {
    id: 12,
    name: "오답 노트",
    path: "/app/wrong-answers",
    description: "틀린 문제 모음",
    icon: XCircle,
    category: "복습",
  },
  {
    id: 13,
    name: "즐겨찾기",
    path: "/app/favorites",
    description: "저장한 단어",
    icon: Heart,
    category: "복습",
  },
  {
    id: 14,
    name: "설정",
    path: "/app/settings",
    description: "앱 환경 설정",
    icon: Settings,
    category: "프로필",
  },
  {
    id: 15,
    name: "프로필",
    path: "/app/profile",
    description: "사용자 정보 및 통계",
    icon: User,
    category: "프로필",
  },
  {
    id: 16,
    name: "커뮤니티",
    path: "/app/community",
    description: "사용자 게시글 피드",
    icon: Users,
    category: "커뮤니티",
  },
  {
    id: 17,
    name: "게시글 작성",
    path: "/app/community/create",
    description: "새 게시글 작성",
    icon: PlusCircle,
    category: "커뮤니티",
  },
  {
    id: 18,
    name: "게시글 상세",
    path: "/app/community/1",
    description: "게시글 및 댓글",
    icon: MessageSquare,
    category: "커뮤니티",
  },
];

const categories = ["인증", "메인", "학습", "퀴즈", "복습", "프로필", "커뮤니티"];

export default function ScreensOverview() {
  const [isSaving, setIsSaving] = useState(false);
  const totalSeedWords = seedWords.length;
  const quizReadySeedWords = seedWords.filter(
    (item) =>
      typeof item.exampleSentence === "string" &&
      typeof item.exampleTranslation === "string" &&
      typeof item.quizKoreanBlank === "string" &&
      Array.isArray(item.quizAnswers) &&
      item.quizAnswers.length > 0,
  ).length;

  const handleSeedWords = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      seedWords.forEach((item) => {
        const ref = doc(db, "words", item.word.toLowerCase());
        batch.set(
          ref,
          {
            ...item,
            mastery: 0,
            isFavorite: false,
            source: "FrequencyWords (CC BY-SA 4.0)",
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      });

      await batch.commit();
      alert(`단어 ${totalSeedWords}개 저장 완료`);
    } catch (error) {
      console.error("단어 시드 저장 실패:", error);
      alert("단어 저장 실패. 콘솔 에러를 확인하세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl">워디 앱</h1>
              <p className="text-muted-foreground">전체 화면 스토리보드</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-sm text-muted-foreground">총 {screens.length}개 화면</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{categories.length}개 카테고리</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="text-sm text-muted-foreground mb-2">디자인 시스템</h3>
            <p className="text-2xl mb-1">토스 스타일</p>
            <p className="text-sm text-muted-foreground">모던하고 깔끔한 UI</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="text-sm text-muted-foreground mb-2">기술 스택</h3>
            <p className="text-2xl mb-1">React + Firebase</p>
            <p className="text-sm text-muted-foreground">React Router, Tailwind CSS</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-border">
            <h3 className="text-sm text-muted-foreground mb-2">인증</h3>
            <p className="text-2xl mb-1">소셜 로그인</p>
            <p className="text-sm text-muted-foreground">Google, Facebook</p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-lg">오픈소스 단어 시드</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            아래 버튼을 누르면 <code className="rounded bg-blue-100 px-2 py-1">words</code> 컬렉션에
            공개 빈도 리스트 기반 단어 {totalSeedWords}개를 저장합니다. 문장 퀴즈용 예문 데이터는 현재{" "}
            {quizReadySeedWords}개 단어에 포함되어 있습니다.
          </p>
          <button
            type="button"
            onClick={handleSeedWords}
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "저장 중..." : `오픈소스 단어 ${totalSeedWords}개 불러오기`}
          </button>
        </div>

        {/* Categories */}
        {categories.map((category) => {
          const categoryScreens = screens.filter((s) => s.category === category);
          
          return (
            <div key={category} className="mb-10">
              <h2 className="text-xl mb-4 px-1">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryScreens.map((screen) => (
                  <Link
                    key={screen.id}
                    to={screen.path}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                      {/* Phone Frame Preview */}
                      <div className="aspect-[9/16] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <screen.icon className="w-16 h-16 text-primary/20" strokeWidth={1.5} />
                        </div>
                        {/* Badge */}
                        <div className="absolute top-3 left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{screen.id}</span>
                        </div>
                        {/* Preview Label */}
                        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-muted-foreground flex items-center gap-1">
                          <span>화면 보기</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <screen.icon className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">{screen.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{screen.description}</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded text-primary">
                          {screen.path}
                        </code>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* Guide Section */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg mb-3">🚀 시작 가이드</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Firebase 설정:</strong>{" "}
              <code className="bg-yellow-100 px-2 py-0.5 rounded text-xs">
                /src/app/lib/firebase.ts
              </code>{" "}
              파일에서 Firebase 프로젝트 설정을 업데이트하세요.
            </p>
            <p>
              <strong>2. 로그인:</strong> Google 또는 Facebook 계정으로 로그인하거나 게스트로 계속하기를 선택하세요.
            </p>
            <p>
              <strong>3. 탐색:</strong> 위의 화면 카드를 클릭하여 각 페이지를 둘러보세요.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>워디 © 2026 - 단어 학습 앱</p>
          <p className="mt-1">Made with Figma Make</p>
        </div>
      </div>
    </div>
  );
}
