import { Outlet, Link, useLocation } from "react-router";
import { Home, BookOpen, RotateCcw, Star, Settings, Users } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // 하단 탭바를 숨길 페이지들
  const hideTabBarPages = ["/app/flashcard-study", "/app/sentence-study", "/app/sentence-quiz"];
  const shouldHideTabBar = hideTabBarPages.includes(location.pathname);

  const navItems = [
    { path: "/app/home", icon: Home, label: "홈" },
    { path: "/app/words", icon: BookOpen, label: "학습" },
    { path: "/app/community", icon: Users, label: "커뮤니티" },
    { path: "/app/favorites", icon: Star, label: "즐겨찾기" },
    { path: "/app/settings", icon: Settings, label: "설정" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className={`flex-1 ${shouldHideTabBar ? "" : "pb-20"}`}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {!shouldHideTabBar && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
          <div className="max-w-md mx-auto flex justify-around items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}