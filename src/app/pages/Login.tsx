import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { 
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Chrome, Facebook as FacebookIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const redirectPath = (location.state as { from?: string } | null)?.from || "/app/home";

  // Google 로그인
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Google 로그인 성공!");
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error("Google 로그인 에러:", error);
      toast.error("Google 로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  // Facebook 로그인
  const handleFacebookLogin = () => {
    toast.info("Facebook 로그인은 아직 설정 중입니다.");
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      toast.success("게스트 로그인 성공!");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("게스트 로그인 에러:", error);
      toast.error("게스트 로그인에 실패했습니다. Firebase 익명 로그인을 활성화하세요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Logo */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-4 shadow-lg">
              <Chrome className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl mb-2">워디</h1>
            <p className="text-muted-foreground text-center">
              간편하게 로그인하고 학습을 시작하세요
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border border-border rounded-xl flex items-center justify-center gap-3 shadow-sm"
            >
              <Chrome className="w-5 h-5" />
              <span>Google로 계속하기</span>
            </Button>

            <Button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full h-14 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white rounded-xl flex items-center justify-center gap-3 shadow-sm"
            >
              <FacebookIcon className="w-5 h-5" />
              <span>Facebook으로 계속하기</span>
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

          {/* Firebase Setup Notice */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs text-yellow-800 text-center">
              💡 Firebase 설정이 필요합니다. <br />
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-1 inline-block">
                /src/app/lib/firebase.ts
              </code> 파일에서 <br />
              Firebase 프로젝트 설정을 업데이트하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
