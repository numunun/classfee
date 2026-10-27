import { PageShell } from "@/components/PageShell";
import { TermsBody } from "@/components/TermsBody";
import { TermsBodyPrev } from "@/components/TermsBodyPrev";
import { PageHeader } from "@/components/PageHeader";
import {
  NEXT_TERMS_VERSION,
  PREV_TERMS_VERSION,
  isNextTermsPending,
  termsDateLabel,
} from "@/lib/terms";

export const metadata = { title: "이용약관 및 개인정보 처리방침" };
// 시행일이 지나면 자동으로 개정판만 보이도록 요청마다 날짜를 다시 본다 (빌드 시점에 굳지 않게)
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const pending = isNextTermsPending();

  return (
    <PageShell>
      <PageHeader back={{ href: "/student", label: "내 화면" }} className="no-print" />

      {pending && (
        <p className="mb-3 rounded-2xl bg-amber-500/10 px-4 py-3.5 text-sm leading-relaxed text-amber-400">
          <b>{termsDateLabel(NEXT_TERMS_VERSION)}부터 아래 개정 약관이 시행돼요.</b> 그 전까지는{" "}
          {termsDateLabel(PREV_TERMS_VERSION)} 판이 적용되며, 맨 아래에서 볼 수 있어요.
        </p>
      )}

      <div className="rounded-3xl bg-surface p-5">
        <TermsBody />
        <p className="mt-6 text-xs text-neutral-600">
          버전 {NEXT_TERMS_VERSION}
          {pending && " (시행 예정)"}
        </p>
      </div>

      {pending && (
        <details className="mt-3 rounded-3xl bg-surface p-5">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-200">
            현재 시행 중인 약관 ({termsDateLabel(PREV_TERMS_VERSION)} 판) 보기
          </summary>
          <div className="mt-4">
            <TermsBodyPrev />
            <p className="mt-6 text-xs text-neutral-600">버전 {PREV_TERMS_VERSION}</p>
          </div>
        </details>
      )}
    </PageShell>
  );
}
