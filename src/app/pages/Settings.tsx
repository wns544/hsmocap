import { Link, useNavigate } from "react-router";
import { ChevronRight, Code2, HelpCircle, LogOut, MessageSquare, Shield, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../contexts/AuthContext";

const settingsGroups = [
  {
    title: "계정",
    items: [{ label: "프로필", icon: User, path: "/app/profile", value: undefined }],
  },
  {
    title: "학습 설정",
    items: [{ label: "일일 학습 목표", path: "/app/settings/goal", value: "20개" }],
  },
  {
    title: "지원",
    items: [
      { label: "도움말", icon: HelpCircle, path: "/app/settings/help", value: undefined },
      { label: "피드백 보내기", icon: MessageSquare, path: "/app/settings/feedback", value: undefined },
      { label: "내 피드백 현황", icon: MessageSquare, path: "/app/settings/feedback/history", value: undefined },
      { label: "개인정보 보호", icon: Shield, path: "/app/settings/privacy", value: undefined },
    ],
  },
  {
    title: "관리",
    items: [{ label: "관리자 대시보드", icon: Code2, path: "/app/admin", value: "Admin" }],
  },
] as const;

export default function Settings() {
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();
  const visibleSettingsGroups = settingsGroups.filter((group) => group.title !== "관리" || isAdmin);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("로그아웃했습니다.");
      navigate("/login");
    } catch {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-white border-b border-border px-6 pt-12 pb-6">
        <h1 className="text-3xl mb-2">설정</h1>
        <p className="text-muted-foreground">환경과 지원 경로를 관리해 보세요.</p>
      </div>

      <div className="px-6 mt-6">
        {visibleSettingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h3 className="text-sm text-muted-foreground mb-3 px-1">{group.title}</h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <Link to={item.path || "#"}>
                    <div className="flex items-center justify-between p-5 active:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        {item.icon && <item.icon className="w-5 h-5 text-muted-foreground" />}
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                  {itemIndex < group.items.length - 1 && <div className="h-px bg-border mx-5" />}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl p-5 border border-border mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">앱 버전</span>
            <span>1.1.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">최신 업데이트</span>
            <span className="text-sm">2026.05.30</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-5 border border-border flex items-center justify-center gap-2 text-destructive active:bg-muted/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Wordy 2026</p>
          <p className="mt-1">즐겁게 영어를 학습해 보세요.</p>
        </div>
      </div>
    </div>
  );
}
