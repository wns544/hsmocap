import { Link, useNavigate } from "react-router";
import {
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  LogOut,
  User,
} from "lucide-react";
import { Switch } from "../components/ui/switch";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("로그아웃되었습니다.");
      navigate("/login");
    } catch (error) {
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  const settingsGroups = [
    {
      title: "계정",
      items: [
        { label: "프로필", icon: User, path: "/app/profile", hasToggle: false },
      ],
    },
    {
      title: "앱 설정",
      items: [
        { label: "알림", icon: Bell, hasToggle: true, value: notifications, onChange: setNotifications },
      ],
    },
    {
      title: "학습 설정",
      items: [
        { label: "일일 학습 목표", path: "/settings/goal", hasToggle: false, value: "20개" },
        { label: "복습 주기", path: "/settings/review", hasToggle: false, value: "매일" },
      ],
    },
    {
      title: "지원",
      items: [
        { label: "도움말", icon: HelpCircle, path: "/settings/help", hasToggle: false },
        { label: "피드백 보내기", icon: MessageSquare, path: "/settings/feedback", hasToggle: false },
        { label: "개인정보 보호", icon: Shield, path: "/settings/privacy", hasToggle: false },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 pt-12 pb-6">
        <h1 className="text-3xl mb-2">설정</h1>
        <p className="text-muted-foreground">앱 환경을 설정하세요</p>
      </div>

      <div className="px-6 mt-6">
        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h3 className="text-sm text-muted-foreground mb-3 px-1">{group.title}</h3>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {item.hasToggle ? (
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="w-5 h-5 text-muted-foreground" />}
                        <span>{item.label}</span>
                      </div>
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onChange}
                      />
                    </div>
                  ) : (
                    <Link to={item.path || "#"}>
                      <div className="flex items-center justify-between p-5 active:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          {item.icon && <item.icon className="w-5 h-5 text-muted-foreground" />}
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.value && (
                            <span className="text-sm text-muted-foreground">{item.value}</span>
                          )}
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  )}
                  {itemIndex < group.items.length - 1 && (
                    <div className="h-px bg-border mx-5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* App Info */}
        <div className="bg-white rounded-2xl p-5 border border-border mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">앱 버전</span>
            <span>1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">최신 업데이트</span>
            <span className="text-sm">2026.03.27</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-5 border border-border flex items-center justify-center gap-2 text-destructive active:bg-muted/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>워디 © 2026</p>
          <p className="mt-1">즐거운 단어 학습 되세요!</p>
        </div>
      </div>
    </div>
  );
}