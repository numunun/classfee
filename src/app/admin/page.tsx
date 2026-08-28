import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelFineButton } from "@/components/CancelFineButton";
import { FINE_TYPE_LABEL, payable, won, shortDate, type Fine, type FineType } from "@/lib/types";

type Row = Fine & { students: { name: string } | null };

export default async function AdminDashboard() {
  const me = await requireStudent();
  const supabase = createClient();

  const { data: finesData } = await supabase
    .from("fines")
    .select("*, students(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const fines = (finesData ?? []) as Row[];

  const now = new Date();
  const thisMonth = fines.filter((f) => {
    const d = new Date(f.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((a, f) => a + payable(f), 0);
  const unpaidTotal = fines
    .filter((f) => f.status === "unpaid" || f.status === "doubled")
    .reduce((a, f) => a + payable(f), 0);
  const pendingCount = fines.filter((f) => f.status === "pending_approval").length;
  const paidCount = fines.filter((f) => f.status === "paid").length;
  const rate = fines.length ? Math.round((paidCount / fines.length) * 100) : 0;

  return (
    <>
      <TopBar title="학급 관리" who={`${me.name} (관리자)`} here="admin" />

      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="이번 달 부과" value={won(monthTotal)} />
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

      <section className="mt-5 rounded-2xl bg-surface">
        <h2 className="px-4 py-3 text-sm font-medium text-neutral-300">최근 벌금 내역</h2>
        <ul className="divide-y divide-line">
          {fines.slice(0, 30).map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={f.students?.name ?? "?"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {f.students?.name} — {FINE_TYPE_LABEL[f.type as FineType]}
                  {f.type === "cleaning" && (
                    <span className="ml-1 text-xs text-neutral-500">(자동 기입)</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">
                  {f.reason ? f.reason + " · " : ""}
                  {shortDate(f.created_at)} 부과
                </p>
              </div>
              <StatusBadge status={f.status} />
              <span className="w-16 text-right text-sm font-medium">{won(payable(f))}</span>
              <CancelFineButton fineId={f.id} />
            </li>
          ))}
          {fines.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-neutral-500">
              아직 부과된 벌금이 없어요. &quot;새 벌금 부과&quot;로 시작하세요.
            </li>
          )}
        </ul>
      </section>
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
