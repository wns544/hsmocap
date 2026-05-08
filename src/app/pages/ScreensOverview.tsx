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
  Search,
  Star,
  Trophy,
  UserCircle2,
  Bell,
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

function MiniPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-3 rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-slate-200" />
      <div className="h-full pt-5">{children}</div>
    </div>
  );
}

function PreviewHeader({
  title,
  subtitle,
  tone = "from-emerald-500 to-teal-500",
}: {
  title: string;
  subtitle: string;
  tone?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${tone} px-3 pb-4 pt-5 text-white`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold">{title}</div>
          <div className="text-[8px] text-white/75">{subtitle}</div>
        </div>
        <Bell className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-xl bg-white/16 p-2 backdrop-blur-sm">
        <div className="mb-1 h-1.5 w-20 rounded-full bg-white/70" />
        <div className="h-1.5 w-14 rounded-full bg-white/35" />
      </div>
    </div>
  );
}

function PreviewListCard({
  title,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[9px] font-semibold text-slate-800">{title}</div>
        <div className="truncate text-[8px] text-slate-400">{subtitle}</div>
      </div>
    </div>
  );
}

function GooglePreviewMark() {
  return <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="" className="h-3.5 w-3.5 object-contain" />;
}

function ScreenPreview({ screen }: { screen: Screen }) {
  if (screen.path === "/onboarding") {
    return (
      <MiniPhoneFrame>
        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-4 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-white shadow-lg">
            <BookOpen className="h-7 w-7 text-emerald-500" />
          </div>
          <div className="mb-1 text-sm font-bold">워디</div>
          <div className="text-center text-[9px] text-white/80">쉽고 재미있는 단어 학습</div>
          <div className="mt-5 flex gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/45" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/45" />
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.path === "/login") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50 px-3 py-4">
          <div className="mb-5 flex flex-col items-center">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 shadow-md">
              <LogIn className="h-5 w-5 text-white" />
            </div>
            <div className="text-[10px] font-semibold text-slate-800">로그인하고 시작하기</div>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] text-slate-400 shadow-sm">이메일</div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] text-slate-400 shadow-sm">비밀번호</div>
            <div className="rounded-xl bg-emerald-500 px-3 py-2 text-[9px] text-white shadow-sm">이메일로 로그인</div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700 shadow-sm">회원가입</div>
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-[9px] text-sky-900 shadow-sm">
              <GooglePreviewMark />
              <span>Google로 계속하기</span>
            </div>
            <div className="rounded-xl bg-slate-200 px-3 py-2 text-[9px] text-slate-700">게스트로 계속하기</div>
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.path === "/app/home") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50">
          <PreviewHeader title="안녕하세요!" subtitle="오늘도 공부해볼까요?" />
          <div className="space-y-2 px-3 py-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <div className="mb-1 h-6 w-6 rounded-lg bg-blue-500" />
                <div className="h-2 w-7 rounded bg-slate-800" />
              </div>
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <div className="mb-1 h-6 w-6 rounded-lg bg-emerald-500" />
                <div className="h-2 w-7 rounded bg-slate-800" />
              </div>
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <div className="mb-1 h-6 w-6 rounded-lg bg-orange-500" />
                <div className="h-2 w-7 rounded bg-slate-800" />
              </div>
            </div>
            <PreviewListCard title="학습하기" subtitle="문장으로 단어 학습" icon={BookOpen} tone="bg-emerald-500" />
            <PreviewListCard title="Shorts 학습" subtitle="카드 넘기기" icon={Layers} tone="bg-violet-500" />
            <PreviewListCard title="복습하기" subtitle="42개 복습 대기" icon={Trophy} tone="bg-orange-500" />
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.path === "/app/words") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50 px-3 py-3">
          <div className="mb-2 text-[10px] font-semibold text-slate-800">단어 학습</div>
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-white px-2 py-2 shadow-sm">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <div className="h-1.5 flex-1 rounded bg-slate-200" />
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[9px] font-semibold">about</div>
                <Star className="h-3 w-3 text-amber-400" />
              </div>
              <div className="mb-2 text-[8px] text-slate-400">~에 대하여</div>
              <div className="h-1.5 w-full rounded bg-slate-100">
                <div className="h-1.5 w-1/2 rounded bg-emerald-500" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
              <div className="mb-1 text-[9px] font-semibold">believe</div>
              <div className="mb-2 text-[8px] text-slate-400">믿다</div>
              <div className="h-1.5 w-full rounded bg-slate-100">
                <div className="h-1.5 w-1/3 rounded bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.path.startsWith("/app/words/")) {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50">
          <PreviewHeader title="about" subtitle="/əˈbaʊt/" tone="from-cyan-500 to-blue-500" />
          <div className="space-y-2 px-3 py-3">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <div className="mb-1 text-[8px] text-slate-400">의미</div>
              <div className="text-[9px] font-semibold text-slate-800">~에 대하여</div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <div className="mb-2 text-[8px] text-slate-400">예문</div>
              <div className="mb-1 h-1.5 w-24 rounded bg-slate-700" />
              <div className="h-1.5 w-20 rounded bg-slate-200" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-[9px] text-emerald-600 shadow-sm">퀴즈로 복습하기</div>
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.path === "/app/community" || screen.path === "/app/community/1" || screen.path === "/app/community/create") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50 px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold text-slate-800">
              {screen.path === "/app/community/create" ? "게시글 작성" : "커뮤니티"}
            </div>
            <UserCircle2 className="h-4 w-4 text-slate-400" />
          </div>
          {screen.path === "/app/community/create" ? (
            <div className="space-y-2">
              <div className="h-8 rounded-xl bg-white shadow-sm" />
              <div className="h-16 rounded-xl bg-white shadow-sm" />
              <div className="rounded-xl bg-emerald-500 px-3 py-2 text-center text-[9px] text-white shadow-sm">게시하기</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-200" />
                  <div className="h-1.5 w-16 rounded bg-slate-300" />
                </div>
                <div className="mb-1 h-1.5 w-full rounded bg-slate-700" />
                <div className="mb-2 h-1.5 w-4/5 rounded bg-slate-200" />
                <div className="flex gap-2 text-[8px] text-slate-400">
                  <span>좋아요 12</span>
                  <span>댓글 4</span>
                </div>
              </div>
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-200" />
                  <div className="h-1.5 w-14 rounded bg-slate-300" />
                </div>
                <div className="h-1.5 w-5/6 rounded bg-slate-700" />
              </div>
            </div>
          )}
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.category === "퀴즈") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-gradient-to-br from-slate-50 to-emerald-50 px-3 py-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full bg-emerald-500 px-2 py-1 text-[8px] font-semibold text-white">3 / 10</div>
            <div className="h-1.5 flex-1 rounded bg-emerald-100">
              <div className="h-1.5 w-1/3 rounded bg-emerald-500" />
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="mb-3 h-2 w-20 rounded bg-slate-700" />
            <div className="mb-3 h-7 rounded-xl border border-emerald-200 bg-slate-50" />
            <div className="space-y-2">
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-[8px] text-slate-700">보기 1</div>
              <div className="rounded-xl bg-emerald-500 px-3 py-2 text-[8px] text-white">정답 제출</div>
            </div>
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.category === "복습") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50 px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold text-slate-800">{screen.name}</div>
            <Trophy className="h-4 w-4 text-orange-400" />
          </div>
          <div className="space-y-2">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <div className="mb-1 text-[9px] font-semibold">about</div>
              <div className="text-[8px] text-slate-400">복습 필요</div>
            </div>
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <div className="mb-1 text-[9px] font-semibold">believe</div>
              <div className="text-[8px] text-slate-400">정답률 60%</div>
            </div>
            <div className="rounded-xl bg-orange-500 px-3 py-2 text-center text-[9px] text-white shadow-sm">다시 학습</div>
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  if (screen.category === "프로필") {
    return (
      <MiniPhoneFrame>
        <div className="h-full bg-slate-50">
          <PreviewHeader title={screen.name} subtitle="사용자 정보 및 통계" tone="from-indigo-500 to-sky-500" />
          <div className="space-y-2 px-3 py-3">
            <div className="flex flex-col items-center rounded-2xl bg-white p-3 shadow-sm">
              <div className="mb-2 h-10 w-10 rounded-full bg-slate-200" />
              <div className="mb-1 h-1.5 w-14 rounded bg-slate-700" />
              <div className="h-1.5 w-10 rounded bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-2 text-center shadow-sm">
                <div className="text-[10px] font-semibold text-slate-800">87%</div>
                <div className="text-[8px] text-slate-400">정답률</div>
              </div>
              <div className="rounded-xl bg-white p-2 text-center shadow-sm">
                <div className="text-[10px] font-semibold text-slate-800">12일</div>
                <div className="text-[8px] text-slate-400">연속 학습</div>
              </div>
            </div>
          </div>
        </div>
      </MiniPhoneFrame>
    );
  }

  return (
    <MiniPhoneFrame>
      <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 to-slate-100 px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-semibold text-slate-800">{screen.name}</div>
          <screen.icon className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <div className="rounded-xl bg-white p-2 shadow-sm">
            <div className="mb-2 h-1.5 w-20 rounded bg-slate-700" />
            <div className="h-1.5 w-14 rounded bg-slate-200" />
          </div>
          <div className="rounded-xl bg-white p-2 shadow-sm">
            <div className="mb-2 h-1.5 w-16 rounded bg-slate-700" />
            <div className="h-1.5 w-24 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </MiniPhoneFrame>
  );
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
    description: "이메일, Google, 익명 로그인",
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
            <p className="text-2xl mb-1">혼합 로그인</p>
            <p className="text-sm text-muted-foreground">이메일, Google, 익명 로그인</p>
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
                      <div className="aspect-[9/16] bg-gradient-to-br from-slate-100 via-white to-emerald-50 relative overflow-hidden">
                        <ScreenPreview screen={screen} />
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
              <strong>2. 로그인:</strong> 이메일 또는 Google 계정으로 로그인하거나 게스트로 계속하기를 선택하세요.
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
