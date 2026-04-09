import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

const sections = [
  {
    title: "1. 총칙",
    body: "Wordy는 이용자의 개인정보를 소중히 보호하며, 관련 법령과 원칙을 준수합니다. 본 개인정보 보호약관은 서비스 이용 과정에서 수집되는 정보의 범위, 이용 목적, 보관 기준 및 이용자의 권리에 관한 사항을 명확하고 투명하게 안내하기 위하여 마련되었습니다.",
  },
  {
    title: "2. 수집하는 개인정보 항목",
    body: "회사는 회원 식별, 서비스 제공, 학습 이력 관리, 고객 문의 응대 및 서비스 품질 개선을 위하여 필요한 최소한의 정보를 수집할 수 있습니다. 여기에는 이름 또는 닉네임, 이메일 주소, 로그인 연동 정보, 학습 기록, 기기 정보, 서비스 접속 로그가 포함될 수 있습니다.",
  },
  {
    title: "3. 개인정보의 이용 목적",
    body: "수집된 정보는 회원 인증, 맞춤형 학습 경험 제공, 학습 통계 산출, 서비스 안정성 확보, 부정 이용 방지, 문의 대응, 공지 전달 및 서비스 개선을 위한 분석 목적 범위 내에서 사용됩니다. 회사는 사전에 고지한 목적을 벗어나 개인정보를 이용하지 않습니다.",
  },
  {
    title: "4. 개인정보의 보관 및 파기",
    body: "회사는 개인정보의 수집 및 이용 목적이 달성된 경우 지체 없이 해당 정보를 파기합니다. 다만 관계 법령에 따라 일정 기간 보관이 필요한 경우에는 법정 보관기간 동안 안전하게 분리 보관한 뒤 적법한 절차에 따라 파기합니다.",
  },
  {
    title: "5. 제3자 제공 및 처리 위탁",
    body: "회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 근거가 있거나 이용자의 명시적 동의가 있는 경우에 한하여 예외적으로 제공할 수 있습니다. 서비스 운영을 위해 일부 업무를 외부 전문업체에 위탁하는 경우, 관련 법령에 따라 필요한 보호조치를 이행합니다.",
  },
  {
    title: "6. 이용자의 권리와 행사 방법",
    body: "이용자는 언제든지 본인의 개인정보에 대하여 조회, 수정, 삭제, 처리정지 요청을 할 수 있으며, 회원 탈퇴를 통하여 개인정보 처리에 대한 동의를 철회할 수 있습니다. 회사는 관련 요청을 접수한 경우 법령상 특별한 사유가 없는 한 지체 없이 필요한 조치를 취합니다.",
  },
  {
    title: "7. 개인정보의 안전성 확보 조치",
    body: "회사는 개인정보의 분실, 도난, 유출, 위조, 변조 또는 훼손을 방지하기 위하여 관리적, 기술적, 물리적 보호조치를 시행합니다. 접근 권한 관리, 인증 절차 강화, 보관 구간 보호, 접속 기록 관리 등 합리적인 수준의 안전장치를 지속적으로 운영합니다.",
  },
  {
    title: "8. 약관의 변경",
    body: "본 약관은 법령, 정책 또는 서비스 내용의 변경에 따라 개정될 수 있습니다. 중요한 변경이 있는 경우 회사는 서비스 내 공지사항 또는 별도의 적절한 수단을 통해 사전에 안내하며, 변경된 약관은 고지된 시행일부터 효력을 가집니다.",
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-950 px-6 pt-12 pb-8 text-white">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
          돌아가기
        </button>

        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-400/12 p-3 text-emerald-300 ring-1 ring-emerald-300/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.24em] text-white/55">Privacy Policy</p>
            <h1 className="text-3xl font-semibold">개인정보 보호약관</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
              Wordy는 이용자의 개인정보를 존중합니다. 본 약관은 서비스 이용 과정에서 회사가 수집,
              이용, 보관 및 보호하는 정보에 관한 기준을 정중하고 명확하게 설명하기 위해 마련되었습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">시행일 2026.04.09</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Wordy 서비스 기준</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">최신 개정본</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              본 약관은 이용자와 회사 간의 신뢰를 보호하기 위한 기준 문서입니다. 이용자는 본 약관을 통해
              개인정보 처리의 범위와 목적, 그리고 본인에게 보장되는 권리를 확인할 수 있습니다.
            </p>
          </div>

          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}

          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-semibold text-emerald-950">문의 및 권리 행사 안내</h2>
            <p className="mt-3 text-sm leading-7 text-emerald-900/80">
              개인정보와 관련한 문의, 열람, 정정, 삭제 또는 처리정지 요청은 서비스 내 고객지원 또는
              피드백 채널을 통해 접수하실 수 있습니다. 회사는 이용자의 요청을 신속하고 성실하게 검토하여,
              관련 법령이 허용하는 범위에서 적절한 조치를 안내해 드립니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
