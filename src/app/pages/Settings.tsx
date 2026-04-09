import { Link, useNavigate } from "react-router";
import {
  ChevronRight,
  HelpCircle,
  LogOut,
  MessageSquare,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const settingsGroups = [
  {
    title: "\uacc4\uc815",
    items: [{ label: "\ud504\ub85c\ud544", icon: User, path: "/app/profile", value: undefined }],
  },
  {
    title: "\ud559\uc2b5 \uc124\uc815",
    items: [{ label: "\uc77c\uc77c \ud559\uc2b5 \ubaa9\ud45c", path: "/settings/goal", value: "20\uac1c" }],
  },
  {
    title: "\uc9c0\uc6d0",
    items: [
      { label: "\ub3c4\uc6c0\ub9d0", icon: HelpCircle, path: "/app/settings/help", value: undefined },
      { label: "\ud53c\ub4dc\ubc31 \ubcf4\ub0b4\uae30", icon: MessageSquare, path: "/app/settings/feedback", value: undefined },
      { label: "\uac1c\uc778\uc815\ubcf4 \ubcf4\ud638", icon: Shield, path: "/app/settings/privacy", value: undefined },
    ],
  },
] as const;

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("\ub85c\uadf8\uc544\uc6c3\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
      navigate("/login");
    } catch {
      toast.error("\ub85c\uadf8\uc544\uc6c3\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-white border-b border-border px-6 pt-12 pb-6">
        <h1 className="text-3xl mb-2">{"\uc124\uc815"}</h1>
        <p className="text-muted-foreground">{"\uc571 \ud658\uacbd\uc744 \uc6d0\ud558\ub294 \ubc29\uc2dd\uc73c\ub85c \uc870\uc815\ud574\ubcf4\uc138\uc694."}</p>
      </div>

      <div className="px-6 mt-6">
        {settingsGroups.map((group, groupIndex) => (
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
            <span className="text-muted-foreground">{"\uc571 \ubc84\uc804"}</span>
            <span>1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{"\ucd5c\uc2e0 \uc5c5\ub370\uc774\ud2b8"}</span>
            <span className="text-sm">2026.03.27</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-5 border border-border flex items-center justify-center gap-2 text-destructive active:bg-muted/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{"\ub85c\uadf8\uc544\uc6c3"}</span>
        </button>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Wordy 2026</p>
          <p className="mt-1">{"\uc990\uac81\uac8c \ub2e8\uc5b4\ub97c \ud559\uc2b5\ud574\ubcf4\uc138\uc694."}</p>
        </div>
      </div>
    </div>
  );
}
