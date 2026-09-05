import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { RecentFines, type FineRow } from "@/components/RecentFines";
import { payable, won } from "@/lib/types";

export default async function AdminDashboard() {
  const me = await requireStudent();
  const supabase = createClient();

  const { data: finesData } = await supabase
    .from("fines")
    .select("*, students!fines_student_id_fkey(name)")
    .order("created_at", { ascending: false });
  const fines = (finesData ?? []) as FineRow[];

  // 취소된 건은 목록에는 남기되(왜 사라졌는지 알 수 있게) 통계에서는 뺀다.
  const live = fines.filter((f) => !f.deleted_at);

  const total = live.reduce((a, f) => a + payable(f), 0);
  const unpaidTotal = live
    .filter((f) => f.status === "unpaid" || f.status === "doubled")
    .reduce((a, f) => a + payable(f), 0);
  const pendingCount = live.filter((f) => f.status === "pending_approval").length;
  const paidCount = live.filter((f) => f.status === "paid").length;
  const rate = live.length ? Math.round((paidCount / live.length) * 100) : 0;

  return (
    <>
      <TopBar title="학급 관리" who={`${me.name} (관리자)`} here="admin" />

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="총 부과 (취소 제외)" value={won(total)} />
        <Stat label="미납" value={won(unpaidTotal)} tone="red" />
        <Stat label="납부 대기" value={`${pendingCount}건`} tone="amber" />
        <Stat label="완납률" value={`${rate}%`} />
      </section>

      <nav className="mt-4 flex flex-wrap gap-2">
        <Action href="/admin/fines" primary>＋ 새 벌금 부과</Action>
        <Action href="/admin/notices">공지</Action>
        <Action href="/admin/cleaning">청소 현황</Action>
        <Action href="/admin/night-study">CIP 관리</Action>
        <Action href="/admin/meals">석식 관리</Action>
        <Action href="/admin/payments">입금 승인</Action>
        <Action href="/admin/students">학생 관리</Action>
        <Action href="/admin/settings">설정</Action>
        <Action href="/admin/debug">진단</Action>
      </nav>

      <div className="mt-5">
        <RecentFines rows={fines} />
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "red" | "amber" }) {
  const c = tone === "red" ? "text-red-400" : tone === "amber" ? "text-amber-400" : "text-neutral-100";
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${c}`}>{value}</p>
    </div>
  );
}

function Action({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
        primary ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-200 hover:bg-line"
      }`}
    >
      {children}
    </Link>
  );
}