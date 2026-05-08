import { ChevronLeft, BookOpen, Home, MessageSquareText, Settings, Star, Users } from "lucide-react";
import { useNavigate } from "react-router";

const quickStartSteps = [
  {
    title: "1. 홈에서 오늘의 흐름 확인",
    description: "홈 탭에서는 학습 통계와 추천 학습 진입점을 빠르게 확인할 수 있습니다. 처음 방문한 경우에는 여기서 오늘 무엇을 시작하면 되는지 감을 잡는 용도로 보시면 됩니다.",
  },
  {
    title: "2. 학습 탭에서 레벨과 단어 확인",
    description: "학습 탭에서는 단어 목록을 살펴보고, 원하는 난이도 또는 학습 레벨에 맞는 단어를 고를 수 있습니다. 문장 학습, Shorts, 복습 기능도 이곳에서 바로 시작할 수 있습니다.",
  },
  {
    title: "3. 짧게 학습하고 바로 복습",
    description: "처음에는 많은 양보다 짧고 자주 학습하는 방식이 편합니다. 문장 퀴즈 또는 카드형 학습으로 가볍게 시작한 뒤, 복습 화면에서 다시 확인하는 흐름을 권장합니다.",
  },
];

const featureSections = [
  {
    icon: Home,
    title: "홈",
    summary: "오늘의 학습 상태와 추천 진입점을 확인하는 시작 화면입니다.",
    details: ["학습 현황, 최근 학습 기록, 빠른 시작 버튼을 한눈에 볼 수 있습니다.", "무엇부터 해야 할지 모를 때 가장 먼저 확인하면 좋은 화면입니다."],
  },
  {
    icon: BookOpen,
    title: "학습",
    summary: "단어 목록을 보고 실제 학습과 복습으로 이동하는 핵심 공간입니다.",
    details: ["단어를 검색하거나 레벨별로 골라볼 수 있습니다.", "문장 학습, Shorts, 복습하기 버튼으로 원하는 학습 방식에 바로 진입할 수 있습니다.", "각 단어를 눌러 뜻과 관련 정보를 자세히 확인할 수 있습니다."],
  },
  {
    icon: Users,
    title: "커뮤니티",
    summary: "다른 사용자와 학습 경험, 질문, 팁을 나누는 공간입니다.",
    details: ["글을 읽으며 학습 아이디어를 얻을 수 있습니다.", "직접 글을 작성해 질문하거나 본인의 학습 경험을 공유할 수 있습니다."],
  },
  {
    icon: Star,
    title: "즐겨찾기",
    summary: "중요하다고 표시한 단어나 학습 대상을 다시 모아보는 화면입니다.",
    details: ["자주 보고 싶은 단어를 따로 관리할 수 있습니다.", "반복 확인이 필요한 항목을 모아 복습 효율을 높일 수 있습니다."],
  },
  {
    icon: Settings,
    title: "설정",
    summary: "프로필, 피드백, 개인정보 보호, 도움말 등 서비스 환경을 조정하는 곳입니다.",
    details: ["앱 사용 중 궁금한 점이 있으면 도움말에서 기본 흐름을 확인할 수 있습니다.", "불편한 점이나 제안은 피드백 보내기를 통해 전달할 수 있습니다."],
  },
  {
    icon: MessageSquareText,
    title: "추천 시작 방법",
    summary: "처음 사용하는 분께는 아래 순서를 권장합니다.",
    details: ["홈에서 오늘의 학습 흐름을 확인합니다.", "학습 탭에서 단어를 몇 개 살펴본 뒤 문장 학습이나 Shorts를 시작합니다.", "학습 후에는 복습 화면이나 즐겨찾기에서 다시 확인하며 익숙해집니다."],
  },
];

export default function HelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 px-6 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100"
        >
          <ChevronLeft className="h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-3xl font-semibold text-stone-900">도움말</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          처음 방문한 사용자도 서비스의 구조를 쉽게 이해할 수 있도록, 주요 기능과 추천 사용 흐름을 간결하게 정리했습니다.
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Quick Start</p>
            <div className="mt-4 space-y-4">
              {quickStartSteps.map((step) => (
                <div key={step.title} className="rounded-2xl bg-white/80 p-4">
                  <h2 className="text-base font-semibold text-stone-900">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {featureSections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-stone-100 p-3 text-stone-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-stone-900">{section.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{section.summary}</p>
                    <div className="mt-4 space-y-2">
                      {section.details.map((detail) => (
                        <p key={detail} className="text-sm leading-6 text-stone-600">
                          • {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
