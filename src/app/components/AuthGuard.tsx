import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import type { ReactNode } from "react";

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">로그인 상태를 확인하는 중...</p>
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RedirectIfAuthenticated() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}

export function RequireAdminAccess({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/app/home" replace />;
  }

  return <>{children}</>;
}
