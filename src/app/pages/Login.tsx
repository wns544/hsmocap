import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  type AuthError,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { auth, googleProvider } from "../lib/firebase";

const GOOGLE_CHROME_LOGO_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg";

function getAuthErrorMessage(
  error: unknown,
  mode: "login" | "signup" | "google" | "guest",
) {
  const code = (error as AuthError | undefined)?.code;

  switch (code) {
    case "auth/email-already-in-use":
      return "이미 가입된 이메일입니다. 이메일 로그인을 이용해 주세요.";
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/user-not-found":
      return "가입되지 않은 이메일입니다. 먼저 회원가입을 진행해 주세요.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return mode === "login"
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : "인증 정보가 올바르지 않습니다.";
    case "auth/weak-password":
      return "비밀번호가 너무 짧습니다. 6자 이상 입력해 주세요.";
    case "auth/popup-closed-by-user":
      return "Google 로그인 창이 닫혔습니다. 다시 시도해 주세요.";
    case "auth/cancelled-popup-request":
      return "Google 로그인 요청이 취소되었습니다. 다시 시도해 주세요.";
    case "auth/popup-blocked":
      return "브라우저가 팝업을 차단했습니다. 팝업을 허용한 뒤 다시 시도해 주세요.";
    case "auth/admin-restricted-operation":
      return "현재 프로젝트 설정에서 허용되지 않은 로그인 방식입니다.";
    case "auth/operation-not-allowed":
      return "Firebase Authentication에서 해당 로그인 방식이 비활성화되어 있습니다.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.";
    case "auth/unauthorized-domain":
      return "현재 접속 주소가 Firebase Authentication 허용 도메인에 등록되어 있지 않습니다.";
    default:
      if (mode === "signup") {
        return "회원가입에 실패했습니다.";
      }

      if (mode === "google") {
        return "Google 로그인에 실패했습니다.";
      }

      if (mode === "guest") {
        return "게스트 로그인에 실패했습니다. Firebase 익명 로그인을 활성화해 주세요.";
      }

      return "이메일 로그인에 실패했습니다.";
  }
}

function isRedirectFallbackError(error: unknown) {
  const code = (error as AuthError | undefined)?.code;
  return code === "auth/popup-blocked" || code === "auth/cancelled-popup-request";
}

function isUnauthorizedDomainError(error: unknown) {
  return (error as AuthError | undefined)?.code === "auth/unauthorized-domain";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInAsGuest, signInForLocalTest, isLocalTestAuthEnabled } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const redirectPath = (location.state as { from?: string } | null)?.from || "/app/home";

  useEffect(() => {
    let mounted = true;

    void getRedirectResult(auth)
      .then((result) => {
        if (!mounted || !result?.user) {
          return;
        }

        toast.success("Google 로그인이 완료되었습니다.");
        navigate(redirectPath, { replace: true });
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        console.error("Google redirect login failed:", error);
        toast.error(getAuthErrorMessage(error, "google"));
      });

    return () => {
      mounted = false;
    };
  }, [navigate, redirectPath]);

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Google 로그인이 완료되었습니다.");
      navigate(redirectPath, { replace: true });
      return;
    } catch (error) {
      console.error("Google login failed:", error);

      if (isRedirectFallbackError(error)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("Google redirect login failed:", redirectError);
          toast.error(getAuthErrorMessage(redirectError, "google"));
          setLoading(false);
          return;
        }
      }

      if (isUnauthorizedDomainError(error) && window.location.hostname === "127.0.0.1") {
        toast.error(
          "127.0.0.1이 Firebase Authentication 허용 도메인에 없어서 Google 로그인이 막히고 있습니다. Firebase 콘솔의 Authentication > Settings > Authorized domains에 127.0.0.1을 추가해 주세요.",
        );
        setLoading(false);
        return;
      }

      toast.error(getAuthErrorMessage(error, "google"));
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success("이메일 로그인이 완료되었습니다.");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Email login failed:", error);
      toast.error(getAuthErrorMessage(error, "login"));
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("회원가입할 이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      toast.success("회원가입이 완료되었습니다.");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Email signup failed:", error);
      toast.error(getAuthErrorMessage(error, "signup"));
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      toast.success("게스트 로그인이 완료되었습니다.");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Guest login failed:", error);
      toast.error(getAuthErrorMessage(error, "guest"));
      setLoading(false);
    }
  };

  const handleLocalTestLogin = async (role: "user" | "admin") => {
    setLoading(true);

    try {
      await signInForLocalTest(role);
      toast.success(role === "admin" ? "로컬 관리자 계정으로 진입했습니다." : "로컬 테스트 유저로 진입했습니다.");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Local test login failed:", error);
      toast.error("로컬 테스트 로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full">
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-4 shadow-lg">
              <Mail className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl mb-2">워디</h1>
            <p className="text-muted-foreground text-center">간편하게 로그인하고 학습을 시작하세요</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-14 rounded-xl bg-white pl-11"
                />
              </div>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-14 rounded-xl bg-white pl-11"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full h-14 rounded-xl bg-primary text-white shadow-sm"
            >
              <span>이메일로 로그인</span>
            </Button>

            <Button
              type="button"
              onClick={handleEmailSignUp}
              disabled={loading}
              variant="outline"
              className="w-full h-14 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
            >
              <span>회원가입</span>
            </Button>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-xl flex items-center justify-center gap-3 shadow-sm"
            >
              <img src={GOOGLE_CHROME_LOGO_SRC} alt="" className="h-5 w-5 object-contain" />
              <span>Google로 계속하기</span>
            </Button>

            <Button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-border rounded-xl flex items-center justify-center gap-3 shadow-sm"
            >
              <span>게스트로 계속하기</span>
            </Button>
          </div>

          {isLocalTestAuthEnabled ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-900">로컬 테스트 빠른 로그인</p>
              <p className="mt-1 text-xs text-emerald-800">
                개발 서버에서만 보이는 테스트 전용 로그인입니다. 일반 유저와 관리자 플로우를 바로 검증할 수 있습니다.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => void handleLocalTestLogin("user")}
                  className="border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
                >
                  로컬 일반 유저
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleLocalTestLogin("admin")}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  로컬 관리자
                </Button>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
