import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Edit,
  Award,
  Trophy,
  Target,
  Calendar,
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
import { Progress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthContext";
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
      containerClassName:
        "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 shadow-lg shadow-amber-500/30",
      iconClassName: "text-white",
      tierLabel: "\ub9c8\uc2a4\ud130",
    };
  }

  if (level >= 15) {
    return {
      icon: Shield,
      containerClassName:
        "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-lg shadow-sky-500/30",
      iconClassName: "text-white",
      tierLabel: "\uc804\ubb38\uac00",
    };
  }

  if (level >= 10) {
    return {
      icon: Flame,
      containerClassName:
        "bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 shadow-lg shadow-rose-500/30",
      iconClassName: "text-white",
      tierLabel: "\ub3c4\uc804\uc790",
    };
  }

  if (level >= 5) {
    return {
      icon: BookOpen,
      containerClassName:
        "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-lg shadow-emerald-500/30",
      iconClassName: "text-white",
      tierLabel: "\ud559\uc2b5\uc790",
    };
  }

  return {
    icon: Sprout,
    containerClassName:
      "bg-gradient-to-br from-lime-300 via-emerald-400 to-green-500 shadow-lg shadow-green-500/30",
    iconClassName: "text-white",
    tierLabel: "\uc0c8\uc2f9",
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<StudyLevel>(getStoredStudyLevel());
  const [progressSummary, setProgressSummary] = useState(() => getStudyProgressSummary());
  const fallbackName = user?.email?.split("@")[0] || "\uc0ac\uc6a9\uc790";

  const userInfo = {
    name: user?.displayName || fallbackName,
    email: user?.email || "user@wordy.com",
    joinDate: user?.metadata.creationTime || "2026-01-15",
    level: progressSummary.level,
    currentExp: progressSummary.currentLevelXp,
    nextLevelExp: progressSummary.nextLevelXp,
  };

  const stats = [
    { label: "\ub204\uc801 \uacbd\ud5d8\uce58", value: `${progressSummary.totalXp} XP`, icon: Award, color: "bg-orange-500" },
    { label: "\ud559\uc2b5\ud55c \ub2e8\uc5b4", value: `${progressSummary.uniqueStudiedWords}\uac1c`, icon: Target, color: "bg-primary" },
    { label: "\ud559\uc2b5 \uc644\ub8cc", value: `${progressSummary.completedSessions}\ud68c`, icon: Trophy, color: "bg-yellow-500" },
    { label: "\ud3c9\uade0 \uc815\ub2f5\ub960", value: `${progressSummary.accuracyRate}%`, icon: TrendingUp, color: "bg-blue-500" },
  ];

  const achievements = progressSummary.achievements;

  const levelProgress = (userInfo.currentExp / userInfo.nextLevelExp) * 100;
  const levelTheme = getProfileLevelTheme(userInfo.level);
  const LevelIcon = levelTheme.icon;

  useEffect(() => {
    setProgressSummary(getStudyProgressSummary());
    return subscribeStudyProgress(() => {
      setProgressSummary(getStudyProgressSummary());
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("\ub85c\uadf8\uc544\uc6c3\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
      navigate("/login");
    } catch {
      toast.error("\ub85c\uadf8\uc544\uc6c3\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.");
    }
  };

  const handleStudyLevelChange = (level: StudyLevel) => {
    setSelectedStudyLevel(level);
    setStoredStudyLevel(level);
    toast.success(`\ud559\uc2b5 \ub808\ubca8\uc774 ${level}(\uc73c)\ub85c \uc124\uc815\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center ${levelTheme.containerClassName}`}
          >
            <LevelIcon className={`w-10 h-10 ${levelTheme.iconClassName}`} strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl mb-1">{userInfo.name}</h1>
            <p className="text-white/80 text-sm">{userInfo.email}</p>
            <p className="text-white/70 text-xs mt-1">{`${levelTheme.tierLabel} 등급`}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Edit className="w-4 h-4" />
            <span>{"\ud504\ub85c\ud544 \uc218\uc815"}</span>
          </Button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>{`\ub808\ubca8 ${userInfo.level}`}</span>
            </div>
            <span className="text-sm">
              {userInfo.currentExp} / {userInfo.nextLevelExp} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-white/20" />
          <p className="text-xs text-white/60 mt-2">
            {`\ub808\ubca8 ${userInfo.level + 1}\uae4c\uc9c0 ${userInfo.nextLevelExp - userInfo.currentExp}XP \ub0a8\uc74c`}
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base">{"\ud559\uc2b5 \ub808\ubca8 \uc124\uc815"}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {"\ud648\uc758 \ud559\uc2b5\ud558\uae30\uc5d0\uc11c \ud45c\uc2dc\ud560 \ub2e8\uc5b4 \ub808\ubca8\uc744 \uace0\ub97c \uc218 \uc788\uc5b4\uc694."}
              </p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedStudyLevel}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {studyLevels.map((level) => (
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
            <span>{"\ud559\uc2b5 \ud1b5\uacc4"}</span>
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{"\ucd08\uae09 \ub2e8\uc5b4"}</span>
                <span className="text-sm">{`${progressSummary.levelBreakdown.초급.studied}\uac1c`}</span>
              </div>
              <Progress value={progressSummary.levelBreakdown.초급.progress} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{"\uc911\uae09 \ub2e8\uc5b4"}</span>
                <span className="text-sm">{`${progressSummary.levelBreakdown.중급.studied}\uac1c`}</span>
              </div>
              <Progress value={progressSummary.levelBreakdown.중급.progress} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{"\uace0\uae09 \ub2e8\uc5b4"}</span>
                <span className="text-sm">{`${progressSummary.levelBreakdown.고급.studied}\uac1c`}</span>
              </div>
              <Progress value={progressSummary.levelBreakdown.고급.progress} className="h-1.5" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>{"\uc131\uce58 \ubc0f \uc5c5\uc801"}</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement, index) => (
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
                    {"\ub2ec\uc131"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-accent rounded-2xl p-5 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            {new Date(userInfo.joinDate).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {"\ubd80\ud130 \ud568\uaed8\ud558\uace0 \uc788\uc5b4\uc694"}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-6 w-full h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          <LogOut className="w-5 h-5" />
          <span>{"\ub85c\uadf8\uc544\uc6c3"}</span>
        </Button>
      </div>
    </div>
  );
}
