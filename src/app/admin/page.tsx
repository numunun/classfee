import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { RecentFines, type FineRow } from "@/components/RecentFines";
import { payable, won } from "@/lib/types";
import {
  FileText,
  Megaphone,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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
  // 입금 확인을 기다리는 사람 = 미납(또는 2배) 벌금이 있는 학생 수
  const unpaidPeople = new Set(
    live.filter((f) => f.status === "unpaid" || f.status === "doubled").map((f) => f.student_id)
  ).size;
  // 완납률은 건수가 아니라 금액 기준으로 낸다.
  // 2배가 된 건이 섞이면 건수 비율은 실제 걷힌 비율과 어긋난다.
  const paidTotal = live
    .filter((f) => f.status === "paid")
    .reduce((a, f) => a + payable(f), 0);
  const rate = total ? Math.round((paidTotal / total) * 100) : 0;

  return (
    <>
      <TopBar title="학급 관리" who={`${me.name} · 관리자`} here="admin" />

      <section className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label="미납" value={won(unpaidTotal)} tone="red" />
        <Stat label="미납 인원" value={`${unpaidPeople}명`} tone="amber" />
        <Stat label="총 부과" value={won(total)} hint="취소 제외" />
        <Stat label="완납률" value={`${rate}%`} progress={rate} />
      </section>

      <Link href="/admin/fines" className="btn btn-primary press mt-4 w-full">
        <Plus className="size-5" aria-hidden />새 벌금 부과
      </Link>

      <nav className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Action href="/admin/payments" icon={Wallet}>입금 확인</Action>
        <Action href="/admin/night-study" icon={Moon}>CIP 관리</Action>
        <Action href="/admin/cleaning" icon={Sparkles}>청소 현황</Action>
        <Action href="/admin/notices" icon={Megaphone}>공지</Action>
        <Action href="/admin/meals" icon={Utensils}>석식 관리</Action>
        <Action href="/admin/students" icon={Users}>학생 관리</Action>
        <Action href="/admin/report" icon={FileText}>회계 보고서</Action>
        <Action href="/admin/settings" icon={Settings}>설정</Action>
        <Action href="/admin/debug" icon={Stethoscope}>진단</Action>
      </nav>

      <div className="mt-6">
        <RecentFines rows={fines} />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
  progress,
}: {
  label: string;
  value: string;
  tone?: "red" | "amber";
  hint?: string;
  /** 0~100. 주면 아래에 진행 막대를 그린다 */
  progress?: number;
}) {
  const c = tone === "red" ? "text-red-400" : tone === "amber" ? "text-amber-400" : "text-neutral-100";
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-xs font-medium text-neutral-500">
        {label}
        {hint && <span className="ml-1 text-neutral-600">· {hint}</span>}
      </p>
      <p className={`mt-1.5 text-[1.375rem] font-bold leading-none tabular-nums ${c}`}>{value}</p>
      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, progress)}%`, background: "rgb(var(--c-accent))" }}
          />
        </div>
      )}
    </div>
  );
}

function Action({
  href,
  icon: Icon,
  badge,
  children,
}: {
  href: string;
  icon: LucideIcon;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="press relative flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-2 py-3 text-center text-[0.8125rem] font-medium text-neutral-200"
    >
      <span className="icon-tile size-9">
        <Icon className="size-[1.125rem]" aria-hidden />
      </span>
      {children}
      {!!badge && (
        <span
          className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-bold"
          style={{ background: "#EF4444", color: "#fff" }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
