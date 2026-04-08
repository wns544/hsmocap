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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { StudyLevel, getStoredStudyLevel, setStoredStudyLevel, studyLevels } from "../lib/studyPreferences";
import { useState } from "react";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<StudyLevel>(getStoredStudyLevel());
  const fallbackName = user?.email?.split("@")[0] || "사용자";

  const userInfo = {
    name: user?.displayName || fallbackName,
    email: user?.email || "user@wordy.com",
    joinDate: user?.metadata.creationTime || "2026-01-15",
    photoURL: user?.photoURL,
    level: 12,
    currentExp: 2450,
    nextLevelExp: 3000,
  };

  const stats = [
    { label: "연속 학습", value: "12일", icon: Calendar, color: "bg-orange-500" },
    { label: "학습한 단어", value: "247개", icon: Target, color: "bg-primary" },
    { label: "퀴즈 완료", value: "42회", icon: Trophy, color: "bg-yellow-500" },
    { label: "평균 정답률", value: "87%", icon: TrendingUp, color: "bg-blue-500" },
  ];

  const achievements = [
    { name: "첫걸음", description: "첫 단어 학습 완료", icon: "🌱", earned: true },
    { name: "연습왕", description: "10개 단어 학습", icon: "📘", earned: true },
    { name: "성실함", description: "7일 연속 학습", icon: "🔥", earned: true },
    { name: "퀴즈 마스터", description: "10회 퀴즈 완료", icon: "🏆", earned: true },
    { name: "집중력", description: "퀴즈 만점 5회", icon: "🎯", earned: false },
    { name: "전문가", description: "100개 단어 학습", icon: "🧠", earned: true },
  ];

  const levelProgress = (userInfo.currentExp / userInfo.nextLevelExp) * 100;

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
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center overflow-hidden text-4xl">
            {userInfo.photoURL ? (
              <img
                src={userInfo.photoURL}
                alt={`${userInfo.name} 프로필 이미지`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              "🙂"
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl mb-1">{userInfo.name}</h1>
            <p className="text-white/80 text-sm">{userInfo.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
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
              <span>레벨 {userInfo.level}</span>
            </div>
            <span className="text-sm">
              {userInfo.currentExp} / {userInfo.nextLevelExp} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-2 bg-white/20" />
          <p className="text-xs text-white/60 mt-2">
            레벨 {userInfo.level + 1}까지 {userInfo.nextLevelExp - userInfo.currentExp}XP 남음
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
              <h3 className="text-base">학습 레벨 설정</h3>
              <p className="text-sm text-muted-foreground mt-1">
                홈의 학습하기에서 표시할 단어 레벨을 고를 수 있어요.
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
            <span>학습 통계</span>
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">초급 단어</span>
                <span className="text-sm">85개</span>
              </div>
              <Progress value={85} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">중급 단어</span>
                <span className="text-sm">120개</span>
              </div>
              <Progress value={65} className="h-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">고급 단어</span>
                <span className="text-sm">42개</span>
              </div>
              <Progress value={30} className="h-1.5" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>달성한 업적</span>
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
                    달성
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
    </div>
  );
}
