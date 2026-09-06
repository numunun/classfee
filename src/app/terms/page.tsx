import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { TermsBody } from "@/components/TermsBody";
import { TERMS_VERSION } from "@/lib/terms";

export const metadata = { title: "이용약관 및 개인정보 처리방침" };

export default function TermsPage() {
  return (
    <PageShell>
      <Link href="/student" className="text-sm text-neutral-500">
        ← 내 화면
      </Link>
      <div className="mt-4 rounded-2xl bg-surface p-5">
        <TermsBody />
        <p className="mt-6 text-xs text-neutral-600">버전 {TERMS_VERSION}</p>
      </div>
    </PageShell>
  );
}