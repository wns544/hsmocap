import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Sparkles } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#6ee7b7,_#10b981_35%,_#064e3b_100%)] px-6 py-10 text-white">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-12 top-20 h-40 w-40 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-20 right-0 h-56 w-56 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/16 shadow-2xl backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white text-emerald-600">
            <BookOpen className="h-10 w-10" strokeWidth={2.4} />
          </div>
        </div>

        <div className="max-w-sm text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            문장과 퀴즈로 익히는 영어 학습
          </div>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight">Wordy</h1>
          <p className="text-lg leading-relaxed text-white/85">
            단어를 외우는 데서 끝나지 않고, 문장 속에서 바로 써보며 기억에 남게 학습해요.
          </p>
        </div>

        <div className="mt-12 grid w-full max-w-md grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <div className="text-xl font-semibold">100+</div>
            <div className="mt-1 text-xs text-white/75">기초 단어</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <div className="text-xl font-semibold">3단계</div>
            <div className="mt-1 text-xs text-white/75">학습 루틴</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
            <div className="text-xl font-semibold">매일</div>
            <div className="mt-1 text-xs text-white/75">짧은 복습</div>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "0.2s" }} />
        <div className="h-2.5 w-2.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
