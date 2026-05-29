import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronLeft,
  CheckCircle2,
  Database,
  FileClock,
  Heart,
  Inbox,
  MessageSquare,
  RefreshCw,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import {
  adminDeleteCommunityComment,
  adminDeleteCommunityPost,
  adminDeleteWord,
  adminListUsers,
  adminResetUserStudyData,
  adminUpsertWord,
  listAdminFeedbacks,
  listAdminLogs,
  setAdminClaim,
  type AdminLogRecord,
  type AdminFeedbackRecord,
  type AdminUserSummary,
  type FeedbackStatus,
  updateAdminFeedbackStatus,
} from "../lib/admin";
import {
  formatCommunityTimestamp,
  listBoardCategories,
  listCommunityPosts,
  type BoardCategory,
  type CommunityPostSummary,
} from "../lib/community";
import { listFavoriteWords, type FavoriteWordItem } from "../lib/favoriteWords";
import { subscribeRecentUserProfiles, type UserProfileSummary } from "../lib/userProfiles";
import { listWordLibraryItems, type WordLibraryItem } from "../lib/wordLibrary";
import { listReviewQueueWordIds, listWordProgresses, type WordProgressRecord } from "../lib/wordProgresses";

interface DashboardState {
  words: WordLibraryItem[];
  posts: CommunityPostSummary[];
  categories: BoardCategory[];
  progresses: WordProgressRecord[];
  reviewQueueIds: string[];
  favorites: FavoriteWordItem[];
  logs: AdminLogRecord[];
  users: AdminUserSummary[];
  feedbacks: AdminFeedbackRecord[];
}

interface WordFormState {
  wordId: string;
  word: string;
  meaning: string;
  level: string;
  mastery: string;
}

const emptyDashboardState: DashboardState = {
  words: [],
  posts: [],
  categories: [],
  progresses: [],
  reviewQueueIds: [],
  favorites: [],
  logs: [],
  users: [],
  feedbacks: [],
};

const emptyWordForm: WordFormState = {
  wordId: "",
  word: "",
  meaning: "",
  level: "초급",
  mastery: "0",
};

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatDateTime(value: Date | null) {
  if (!value) return "기록 없음";
  return value.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildLevelRows(words: WordLibraryItem[]) {
  const counts = words.reduce<Record<string, number>>((acc, word) => {
    const level = word.level || "미분류";
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .map(([level, count]) => ({
      level,
      count,
      ratio: words.length > 0 ? (count / words.length) * 100 : 0,
    }));
}

function getWeakProgresses(progresses: WordProgressRecord[]) {
  return progresses
    .filter((progress) => progress.totalAnswerCount > 0)
    .map((progress) => ({
      ...progress,
      accuracy: progress.correctAnswerCount / progress.totalAnswerCount,
    }))
    .filter((progress) => progress.lastResult === "wrong" || progress.accuracy < 0.7 || progress.currentStage < 2)
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 5);
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, refreshAuthClaims } = useAuth();
  const [data, setData] = useState<DashboardState>(emptyDashboardState);
  const [recentProfiles, setRecentProfiles] = useState<UserProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [wordQuery, setWordQuery] = useState("");
  const [wordForm, setWordForm] = useState<WordFormState>(emptyWordForm);
  const [targetAdminUid, setTargetAdminUid] = useState("");
  const [commentDeleteForm, setCommentDeleteForm] = useState({ postId: "", commentId: "" });

  const loadDashboard = async () => {
    if (!user) {
      setData(emptyDashboardState);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const [words, posts, categories, progresses, reviewQueueIds, favorites, logs, feedbacks] = await Promise.all([
        listWordLibraryItems(),
        listCommunityPosts(),
        listBoardCategories(),
        listWordProgresses(user.uid),
        listReviewQueueWordIds(user.uid),
        listFavoriteWords(user.uid),
        isAdmin ? listAdminLogs().catch(() => []) : Promise.resolve([]),
        isAdmin ? listAdminFeedbacks().catch(() => []) : Promise.resolve([]),
      ]);

      const users = isAdmin ? await adminListUsers().catch(() => []) : [];

      setData({ words, posts, categories, progresses, reviewQueueIds, favorites, logs, users, feedbacks });
      setLastLoadedAt(new Date());
    } catch (error) {
      console.error("관리자 대시보드 데이터를 불러오지 못했습니다.", error);
      setErrorMessage("데이터를 불러오지 못했습니다. Firebase 권한 또는 네트워크 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [user, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setRecentProfiles([]);
      return;
    }

    return subscribeRecentUserProfiles(setRecentProfiles);
  }, [isAdmin]);

  const runAdminAction = async (message: string, action: () => Promise<void>) => {
    setWorking(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await action();
      setSuccessMessage(message);
      await loadDashboard();
    } catch (error) {
      console.error("관리자 작업 실패", error);
      setErrorMessage("관리자 작업에 실패했습니다. admin claim, Functions 배포 상태, 입력값을 확인하세요.");
    } finally {
      setWorking(false);
    }
  };

  const handleSyncAdminClaim = () =>
    runAdminAction("admin claim을 현재 계정에 반영했습니다. 권한이 바로 보이지 않으면 다시 로그인하세요.", async () => {
      if (!user) throw new Error("Missing user");
      await setAdminClaim(user.uid, true);
      await refreshAuthClaims();
    });

  const handleSaveWord = () =>
    runAdminAction("단어를 저장했습니다.", async () => {
      await adminUpsertWord({
        wordId: wordForm.wordId.trim() || undefined,
        word: wordForm.word,
        meaning: wordForm.meaning,
        level: wordForm.level,
        mastery: Number(wordForm.mastery || 0),
      });
      setWordForm(emptyWordForm);
    });

  const handleDeleteWord = (wordId: string) => {
    if (!window.confirm(`단어 ${wordId}를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    void runAdminAction("단어를 삭제했습니다.", async () => {
      await adminDeleteWord(wordId);
      setWordForm(emptyWordForm);
    });
  };

  const handleDeletePost = (postId: string, title: string) => {
    if (!window.confirm(`게시글 "${title}"을 삭제할까요? 댓글과 좋아요도 함께 삭제됩니다.`)) return;
    void runAdminAction("게시글을 삭제했습니다.", async () => {
      await adminDeleteCommunityPost(postId);
    });
  };

  const handleDeleteComment = () =>
    runAdminAction("댓글을 삭제했습니다.", async () => {
      await adminDeleteCommunityComment(commentDeleteForm.postId, commentDeleteForm.commentId);
      setCommentDeleteForm({ postId: "", commentId: "" });
    });

  const handleSetAdmin = (admin: boolean) =>
    runAdminAction(admin ? "관리자 권한을 부여했습니다." : "관리자 권한을 해제했습니다.", async () => {
      await setAdminClaim(targetAdminUid, admin);
      if (targetAdminUid === user?.uid) {
        await refreshAuthClaims();
      }
    });

  const handleResetUserStudyData = (uid: string) => {
    if (!window.confirm(`${uid} 사용자의 학습 데이터와 즐겨찾기를 초기화할까요? 계정 자체는 삭제하지 않습니다.`)) return;
    void runAdminAction("사용자 학습 데이터를 초기화했습니다.", async () => {
      await adminResetUserStudyData(uid);
    });
  };

  const handleUpdateFeedbackStatus = (feedbackId: string, status: FeedbackStatus) =>
    runAdminAction("피드백 상태를 변경했습니다.", async () => {
      await updateAdminFeedbackStatus(feedbackId, status);
    });

  const summary = useMemo(() => {
    const studiedWords = data.progresses.filter((progress) => progress.totalAnswerCount > 0);
    const masteredWords = data.progresses.filter((progress) => progress.status === "MASTERED");
    const totalAnswers = data.progresses.reduce((sum, progress) => sum + progress.totalAnswerCount, 0);
    const correctAnswers = data.progresses.reduce((sum, progress) => sum + progress.correctAnswerCount, 0);
    const totalViews = data.posts.reduce((sum, post) => sum + post.viewCount, 0);
    const openFeedbacks = data.feedbacks.filter((feedback) => feedback.status !== "resolved").length;

    return {
      studiedWords: studiedWords.length,
      masteredWords: masteredWords.length,
      answerAccuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      totalViews,
      openFeedbacks,
    };
  }, [data]);

  const levelRows = useMemo(() => buildLevelRows(data.words), [data.words]);
  const weakProgresses = useMemo(() => getWeakProgresses(data.progresses), [data.progresses]);
  const filteredWords = useMemo(() => {
    const query = wordQuery.trim().toLowerCase();
    return data.words
      .filter((word) => {
        if (!query) return true;
        return (
          word.id.toLowerCase().includes(query) ||
          word.word.toLowerCase().includes(query) ||
          word.meaning.toLowerCase().includes(query) ||
          word.level.toLowerCase().includes(query)
        );
      })
      .slice(0, 20);
  }, [data.words, wordQuery]);
  const recentPosts = useMemo(
    () =>
      [...data.posts]
        .sort((left, right) => (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0))
        .slice(0, 10),
    [data.posts],
  );

  const metricCards = [
    { label: "단어 라이브러리", value: data.words.length, helper: `${levelRows.length}개 레벨`, icon: BookOpen },
    { label: "게시글", value: data.posts.length, helper: `조회 ${summary.totalViews}회`, icon: MessageSquare },
    { label: "피드백", value: data.feedbacks.length, helper: `미처리 ${summary.openFeedbacks}건`, icon: Inbox },
    { label: "복습 대기", value: data.reviewQueueIds.length, helper: `마스터 ${summary.masteredWords}개`, icon: Activity },
  ];

  const healthChecks = [
    {
      label: "관리자 권한",
      status: isAdmin ? "활성" : "확인 필요",
      description: isAdmin ? "admin claim 또는 bootstrap UID로 접근 중입니다." : "관리자 claim이 없습니다.",
      ok: isAdmin,
    },
    {
      label: "인증 상태",
      status: user ? "정상" : "확인 필요",
      description: user ? `UID ${user.uid.slice(0, 8)}...` : "로그인 사용자 정보가 없습니다.",
      ok: Boolean(user),
    },
    {
      label: "데이터 읽기",
      status: data.words.length > 0 && data.posts.length > 0 ? "정상" : "확인 필요",
      description: `${data.words.length}개 단어, ${data.posts.length}개 게시글`,
      ok: data.words.length > 0 && data.posts.length > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-border px-5 sm:px-8 pt-10 pb-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 hover:bg-muted"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <Database className="w-4 h-4" />
              <span>Wordy Admin Console</span>
            </div>
            <h1 className="text-3xl mb-2">관리자 대시보드</h1>
            <p className="text-muted-foreground">학습 데이터, 커뮤니티, 단어 라이브러리, 관리자 권한을 점검하고 관리합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleSyncAdminClaim} disabled={working}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              admin claim 동기화
            </Button>
            <Button variant="outline" onClick={loadDashboard} disabled={loading || working}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
            <Link to="/app/settings">
              <Button variant="ghost">설정</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <div key={metric.label} className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <metric.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-muted-foreground">{metric.helper}</span>
              </div>
              <div className="text-3xl font-semibold mb-1">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>

        <section className="bg-white border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl mb-1">최근 로그인 / 활동</h2>
              <p className="text-sm text-muted-foreground">로그인 직후와 활동 중 상태가 바로 반영됩니다.</p>
            </div>
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {recentProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 기록된 최근 로그인 정보가 없습니다.</p>
            ) : (
              recentProfiles.map((profile) => (
                <div key={profile.uid} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium">{profile.displayName}</div>
                      <div className="text-sm text-muted-foreground break-all">{profile.email || "이메일 없음"}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>최근 활동 {formatDateTime(profile.lastSeenAt)}</div>
                      <div>최근 로그인 {formatDateTime(profile.lastLoginAt)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto rounded-lg">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="words">단어 관리</TabsTrigger>
            <TabsTrigger value="community">커뮤니티</TabsTrigger>
            <TabsTrigger value="feedbacks">피드백</TabsTrigger>
            <TabsTrigger value="users">권한</TabsTrigger>
            <TabsTrigger value="logs">감사 로그</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl mb-1">단어 레벨 분포</h2>
                    <p className="text-sm text-muted-foreground">Firestore words 컬렉션 기준입니다.</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  {levelRows.map((row) => (
                    <div key={row.level}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>{row.level}</span>
                        <span className="text-muted-foreground">{row.count}개</span>
                      </div>
                      <Progress value={row.ratio} className="h-2" />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl mb-1">상태 점검</h2>
                    <p className="text-sm text-muted-foreground">
                      {lastLoadedAt ? `${lastLoadedAt.toLocaleTimeString("ko-KR")} 기준` : "아직 동기화 전"}
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {healthChecks.map((check) => (
                    <div key={check.label} className="flex items-start gap-3 rounded-lg border border-border p-4">
                      {check.ok ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span>{check.label}</span>
                          <span className="text-xs text-muted-foreground">{check.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">취약 학습 항목</h2>
                  <p className="text-sm text-muted-foreground">내 계정의 오답률과 복습 단계 기준입니다.</p>
                </div>
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {weakProgresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">아직 취약 항목이 없습니다.</p>
                ) : (
                  weakProgresses.map((progress) => (
                    <div key={progress.wordId} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <div className="font-medium">{progress.wordId}</div>
                        <div className="text-sm text-muted-foreground">
                          {progress.correctAnswerCount}/{progress.totalAnswerCount} 정답, 단계 {progress.currentStage}
                        </div>
                      </div>
                      <span className="text-sm text-orange-600">{formatPercent(progress.accuracy * 100)}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="words" className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">단어 생성/수정</h2>
                  <p className="text-sm text-muted-foreground">ID를 비우면 새 단어 문서를 생성합니다.</p>
                </div>
                <Save className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <Input placeholder="wordId" value={wordForm.wordId} onChange={(event) => setWordForm({ ...wordForm, wordId: event.target.value })} />
                <Input placeholder="영어 단어" value={wordForm.word} onChange={(event) => setWordForm({ ...wordForm, word: event.target.value })} />
                <Textarea placeholder="뜻" value={wordForm.meaning} onChange={(event) => setWordForm({ ...wordForm, meaning: event.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="레벨" value={wordForm.level} onChange={(event) => setWordForm({ ...wordForm, level: event.target.value })} />
                  <Input type="number" min="0" max="100" placeholder="숙련도" value={wordForm.mastery} onChange={(event) => setWordForm({ ...wordForm, mastery: event.target.value })} />
                </div>
                <Button onClick={handleSaveWord} disabled={working} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            </section>

            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">단어 목록</h2>
                  <p className="text-sm text-muted-foreground">검색 후 선택하면 왼쪽 폼에 채워집니다.</p>
                </div>
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <Input className="mb-4" placeholder="단어, 뜻, 레벨 검색" value={wordQuery} onChange={(event) => setWordQuery(event.target.value)} />
              <div className="space-y-3">
                {filteredWords.map((word) => (
                  <div key={word.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        className="text-left flex-1"
                        onClick={() =>
                          setWordForm({
                            wordId: word.id,
                            word: word.word,
                            meaning: word.meaning,
                            level: word.level,
                            mastery: String(word.mastery ?? 0),
                          })
                        }
                      >
                        <div className="font-medium">{word.word}</div>
                        <div className="text-sm text-muted-foreground mt-1">{word.meaning}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {word.id} · {word.level} · 숙련도 {word.mastery}
                        </div>
                      </button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteWord(word.id)} disabled={working}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="community" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">게시글 관리</h2>
                  <p className="text-sm text-muted-foreground">삭제는 Cloud Function을 통해 댓글과 좋아요까지 정리합니다.</p>
                </div>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/app/community/${post.id}`} className="flex-1">
                        <div className="font-medium line-clamp-1">{post.title}</div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                          <span>{post.categoryName}</span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.likeCount}
                          </span>
                          <span>댓글 {post.commentCount}</span>
                          <span>조회 {post.viewCount}</span>
                          <span>{formatCommunityTimestamp(post.createdAt)}</span>
                        </div>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleDeletePost(post.id, post.title)} disabled={working}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">댓글 삭제</h2>
                  <p className="text-sm text-muted-foreground">문제가 있는 댓글의 postId와 commentId를 입력합니다.</p>
                </div>
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="postId"
                  value={commentDeleteForm.postId}
                  onChange={(event) => setCommentDeleteForm({ ...commentDeleteForm, postId: event.target.value })}
                />
                <Input
                  placeholder="commentId"
                  value={commentDeleteForm.commentId}
                  onChange={(event) => setCommentDeleteForm({ ...commentDeleteForm, commentId: event.target.value })}
                />
                <Button variant="outline" onClick={handleDeleteComment} disabled={working} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  댓글 삭제
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="feedbacks">
            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">피드백 관리</h2>
                  <p className="text-sm text-muted-foreground">설정 탭에서 접수된 사용자 피드백입니다. 중요 피드백은 목록에서 강조됩니다.</p>
                </div>
                <Inbox className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {data.feedbacks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">접수된 피드백이 없습니다.</p>
                ) : (
                  data.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                              {feedback.categoryName || feedback.categoryId}
                            </span>
                            {feedback.isImportant && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-600">중요</span>
                            )}
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                              {feedback.status}
                            </span>
                          </div>
                          <div className="font-medium">{feedback.title}</div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{feedback.body}</p>
                          {feedback.imageUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                              {feedback.imageUrls.map((imageUrl, index) => (
                                <a
                                  key={imageUrl}
                                  href={imageUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group block overflow-hidden rounded-lg border border-border bg-muted"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`피드백 첨부 이미지 ${index + 1}`}
                                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground break-all">
                            {feedback.authorName || "사용자"} · {feedback.authorEmail || "이메일 없음"} · UID {feedback.userId}
                            · {formatDateTime(feedback.createdAt)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button
                            variant={feedback.status === "open" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateFeedbackStatus(feedback.id, "open")}
                            disabled={working}
                          >
                            접수
                          </Button>
                          <Button
                            variant={feedback.status === "reviewing" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateFeedbackStatus(feedback.id, "reviewing")}
                            disabled={working}
                          >
                            확인중
                          </Button>
                          <Button
                            variant={feedback.status === "resolved" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUpdateFeedbackStatus(feedback.id, "resolved")}
                            disabled={working}
                          >
                            처리완료
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="bg-white border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl mb-1">관리자 권한</h2>
                    <p className="text-sm text-muted-foreground">UID 기준으로 admin custom claim을 부여하거나 해제합니다.</p>
                  </div>
                  <UserCog className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <Input placeholder="대상 UID" value={targetAdminUid} onChange={(event) => setTargetAdminUid(event.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleSetAdmin(true)} disabled={working || !targetAdminUid.trim()}>
                      권한 부여
                    </Button>
                    <Button variant="outline" onClick={() => handleSetAdmin(false)} disabled={working || !targetAdminUid.trim()}>
                      권한 해제
                    </Button>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-border rounded-lg p-5">
                <h2 className="text-xl mb-4">현재 세션</h2>
                <div className="space-y-3">
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground mb-1">내 UID</div>
                    <div className="break-all">{user?.uid ?? "로그인 정보 없음"}</div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground mb-1">관리자 상태</div>
                    <div>{isAdmin ? "활성" : "비활성"}</div>
                  </div>
                </div>
              </section>
            </div>

            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">사용자 목록</h2>
                  <p className="text-sm text-muted-foreground">Firebase Auth 최근 사용자 50명을 조회합니다.</p>
                </div>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {data.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">사용자 목록을 불러오지 못했거나 아직 Functions가 배포되지 않았습니다.</p>
                ) : (
                  data.users.map((item) => (
                    <div key={item.uid} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="font-medium">{item.displayName || item.email || item.providerId}</div>
                          <div className="text-sm text-muted-foreground break-all">{item.uid}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.providerId} · {item.admin ? "admin" : "user"} · 최근 로그인 {item.lastSignInTime || "기록 없음"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => setTargetAdminUid(item.uid)}>
                            UID 선택
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleResetUserStudyData(item.uid)} disabled={working}>
                            학습 초기화
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="logs">
            <section className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-1">감사 로그</h2>
                  <p className="text-sm text-muted-foreground">관리자 함수가 실행한 변경 작업을 기록합니다.</p>
                </div>
                <FileClock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {data.logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">표시할 로그가 없습니다. Rules 배포 전이면 조회가 제한될 수 있습니다.</p>
                ) : (
                  data.logs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="font-medium">{log.action}</div>
                        <div className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</div>
                      </div>
                      <div className="text-sm text-muted-foreground break-all">
                        {log.targetType}:{log.targetId} · admin {log.adminUid}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
