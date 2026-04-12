import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-12 h-12 text-primary" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1 className="text-white text-4xl mb-2">Wordy</h1>
          <p className="text-white/80 text-lg">문장과 퀴즈로 익히는 영어 학습</p>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
