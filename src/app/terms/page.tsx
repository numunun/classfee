import { PageShell } from "@/components/PageShell";
import { TermsBody } from "@/components/TermsBody";
import { TERMS_VERSION } from "@/lib/terms";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "이용약관 및 개인정보 처리방침" };

export default function TermsPage() {
  return (
    <PageShell>
      <PageHeader back={{ href: "/student", label: "내 화면" }} className="no-print" />
      <div className="rounded-3xl bg-surface p-5">
        <TermsBody />
        <p className="mt-6 text-xs text-neutral-600">버전 {TERMS_VERSION}</p>
      </div>
    </PageShell>
  );
}