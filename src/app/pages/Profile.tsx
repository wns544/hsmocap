import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Edit,
  Award,
  Trophy,
  Target,
  TrendingUp,
  LogOut,
  Sprout,
  BookOpen,
  Flame,
  Shield,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthContext";
import { resolveProfileName, setStoredProfileName, subscribeProfileName } from "../lib/profileName";
import { StudyLevel, getStoredStudyLevel, setStoredStudyLevel, studyLevels } from "../lib/studyPreferences";
import { getStudyProgressSummary, subscribeStudyProgress } from "../lib/studyProgress";

function getProfileLevelTheme(level: number): {
  icon: LucideIcon;
  containerClassName: string;
  iconClassName: string;
  tierLabel: string;
} {
  if (level >= 20) {
    return {
      icon: Crown,
      containerClassName: "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 shadow-lg shadow-amber-500/30",
      iconClassName: "text-white",
      tierLabel: "마스터",
    };
  }

  if (level >= 15) {
    return {
      icon: Shield,
      containerClassName: "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-lg shadow-sky-500/30",
      iconClassName: "text-white",
      tierLabel: "전문가",
    };
  }

  if (level >= 10) {
    return {
      icon: Flame,
      containerClassName: "bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 shadow-lg shadow-rose-500/30",
      iconClassName: "text-white",
      tierLabel: "도전자",
    };
  }

  if (level >= 5) {
    return {
      icon: BookOpen,
      containerClassName: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-lg shadow-emerald-500/30",
      iconClassName: "text-white",
      tierLabel: "학습자",
    };
  }

  return {
    icon: Sprout,
    containerClassName: "bg-gradient-to-br from-lime-300 via-emerald-400 to-green-500 shadow-lg shadow-green-500/30",
    iconClassName: "text-white",
    tierLabel: "새싹",
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<StudyLevel>(getStoredStudyLevel());
  const [progressSummary, setProgressSummary] = useState(() => getStudyProgressSummary());
  const [displayName, setDisplayName] = useState(() => resolveProfileName(user?.displayName, user?.email));
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState(() => resolveProfileName(user?.displayName, user?.email));

  const levelTheme = getProfileLevelTheme(progressSummary.level);
  const LevelIcon = levelTheme.icon;
  const visibleStudyLevels = studyLevels.slice(0, 4);
  const displayedStudyLevel = visibleStudyLevels.includes(selectedStudyLevel) ? selectedStudyLevel : visibleStudyLevels[0];
  const levelProgress = progressSummary.nextLevelXp > 0
    ? (progressSummary.currentLevelXp / progressSummary.nextLevelXp) * 100
    : 0;

  const levelBreakdownList = useMemo(() => {
    const items = Object.values(progressSummary.levelBreakdown);
    const empty = { studied: 0, total: 0, progress: 0 };

    return [
      { label: "초급 단어", ...(items[0] ?? empty) },
      { label: "중급 단어", ...(items[1] ?? empty) },
      { label: "고급 단어", ...(items[2] ?? empty) },
    ];
  }, [progressSummary.levelBreakdown]);

  const stats = [
    { label: "누적 경험치", value: `${progressSummary.totalXp} XP`, icon: Award, color: "bg-orange-500" },
    { label: "학습한 단어", value: `${progressSummary.uniqueStudiedWords}개`, icon: Target, color: "bg-primary" },
    { label: "학습 완료", value: `${progressSummary.completedSessions}회`, icon: Trophy, color: "bg-yellow-500" },
    { label: "평균 정답률", value: `${progressSummary.accuracyRate}%`, icon: TrendingUp, color: "bg-blue-500" },
  ];

  useEffect(() => {
    setProgressSummary(getStudyProgressSummary());

    return subscribeStudyProgress(() => {
      setProgressSummary(getStudyProgressSummary());
    });
  }, []);

  useEffect(() => {
    const resolvedName = resolveProfileName(user?.displayName, user?.email);
    setDisplayName(resolvedName);
    setNameInput(resolvedName);

    return subscribeProfileName((nextName) => {
      const fallbackName = resolveProfileName(user?.displayName, user?.email);
      const resolvedNextName = nextName || fallbackName;
      setDisplayName(resolvedNextName);
      setNameInput(resolvedNextName);
    });
  }, [user?.displayName, user?.email]);

  useEffect(() => {
    if (visibleStudyLevels.includes(selectedStudyLevel)) {
      return;
    }

    const fallbackLevel = visibleStudyLevels[0];
    setSelectedStudyLevel(fallbackLevel);
    setStoredStudyLevel(fallbackLevel);
  }, [selectedStudyLevel, visibleStudyLevels]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("로그아웃되었습니다.");
      navigate("/login");
    } catch {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  const handleStudyLevelChange = (level: StudyLevel) => {
    setSelectedStudyLevel(level);
    setStoredStudyLevel(level);
    toast.success(`학습 레벨이 ${level}(으)로 설정되었습니다.`);
  };

  const handleOpenEditDialog = () => {
    setNameInput(displayName);
    setIsEditDialogOpen(true);
  };

  const handleSaveProfileName = () => {
    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      toast.error("사용자 이름을 입력해주세요.");
      return;
    }

    setStoredProfileName(trimmedName);
    setDisplayName(trimmedName);
    setIsEditDialogOpen(false);
    toast.success("사용자 이름이 수정되었습니다.");
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <button
          onClick={() => navigate("/app/settings")}
          className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${levelTheme.containerClassName}`}>
            <LevelIcon className={`w-10 h-10 ${levelTheme.iconClassName}`} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl mb-1">{displayName}</h1>
            <p className="text-white/80 text-sm">{user?.email || "user.wordy.com"}</p>
            <p className="text-white/70 text-xs mt-1">{`${levelTheme.tierLabel} 등급`}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenEditDialog}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Edit className="w-4 h-4" />
            <span>프로필 수정</span>
          </Button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>{`레벨 ${progressSummary.level}`}</span>
            </div>
            <span className="text-sm">
              {progressSummary.currentLevelXp} / {progressSummary.nextLevelXp} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-white/20 [&_[data-slot=progress-indicator]]:bg-[#D8C3A5]" />
          <p className="text-xs text-white/60 mt-2">
            {`레벨 ${progressSummary.level + 1}까지 ${progressSummary.xpToNextLevel}XP 남음`}
          </p>
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 border border-border">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-2xl mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border mb-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h3 className="text-base">학습 레벨 설정</h3>
              <p className="text-sm text-muted-foreground mt-1">
                홈과 학습 화면에서 우선적으로 사용할 단어 레벨을 정할 수 있어요.
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {displayedStudyLevel}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {visibleStudyLevels.map((level) => (
              <Button
                key={level}
                type="button"
                variant={selectedStudyLevel === level ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => handleStudyLevelChange(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-border mb-6">
          <h3 className="mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>학습 통계</span>
          </h3>
          <div className="space-y-4">
            {levelBreakdownList.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm">{`${item.studied}개`}</span>
                </div>
                <Progress value={item.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>획득한 업적</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {progressSummary.achievements.map((achievement, index) => (
              <div
                key={index}
                className={`rounded-2xl p-4 border-2 text-center ${
                  achievement.earned ? "bg-white border-primary" : "bg-muted/30 border-border opacity-50"
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-xs mb-1">{achievement.name}</div>
                <div className="text-xs text-muted-foreground">{achievement.description}</div>
                {achievement.earned && (
                  <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary text-xs">
                    달성
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            {new Date(user?.metadata.creationTime || "2026-01-15").toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            부터 함께하고 있어요
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-6 w-full h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
            <DialogDescription>
              홈 화면과 프로필 화면에 표시될 사용자 이름을 변경할 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="profile-name">사용자 이름</Label>
            <Input
              id="profile-name"
              value={nameInput}
              maxLength={20}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="이름을 입력해주세요"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button type="button" onClick={handleSaveProfileName}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
