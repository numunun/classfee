import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PenaltyStatus } from "@/components/PenaltyStatus";
import { FINE_TYPE_LABEL, payable, won, type Fine } from "@/lib/types";
import {
  NS_LABEL,
  NS_STYLE,
  SESSIONS,
  SESSION_LABEL,
  ACADEMY_SESSIONS,
  todayISO,
  weekdayIndex,
  seatNo,
  type NightStatus,
} from "@/lib/night-study";

export const dynamic = "force-dynamic";
export const metadata = { title: "학생 상세" };

const DAYS = ["", "월", "화", "수", "목"];

function ko(d: string) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

function dt(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const today = todayISO();
  const wd = weekdayIndex();

  const { data: student } = await supabase
    .from("students")
    .select("id, name, student_number, google_email, role, is_independent, auth_user_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!student) notFound();

  const [{ data: finesData }, { data: nsData }, { data: acaData }, { data: prData }] =
    await Promise.all([
      supabase
        .from("fines")
        .select("*")
        .eq("student_id", params.id)
        .order("occurred_date", { ascending: false }),
      supabase
        .from("night_study_records")
        .select("session, status, reason, self_reported")
        .eq("student_id", params.id)
        .eq("study_date", today),
      supabase.from("academy_schedules").select("weekday").eq("student_id", params.id),
      supabase
        .from("payment_requests")
        .select("id, total_amount, depositor_name, status, reviewed_at, reject_reason")
        .eq("student_id", params.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const fines = (finesData ?? []) as Fine[];
  const live = fines.filter((f) => !f.deleted_at);
  const owingTotal = live
    .filter((f) => ["unpaid", "doubled", "pending_approval"].includes(f.status))
    .reduce((a, f) => a + payable(f), 0);
  const cumulative = live.reduce((a, f) => a + payable(f), 0);

  const recs = new Map(
    ((nsData ?? []) as {
      session: number;
      status: NightStatus;
      reason: string | null;
      self_reported: boolean;
    }[]).map((r) => [r.session, r])
  );

  const academyDays = Array.from(
    new Set(((acaData ?? []) as { weekday: number }[]).map((a) => a.weekday))
  ).sort();

  const requests = (prData ?? []) as {
    id: string;
    total_amount: number;
    depositor_name: string;
    status: string;
    reviewed_at: string | null;
    reject_reason: string | null;
  }[];

  function cipStatus(session: number): NightStatus {
    const rec = recs.get(session);
    if (rec) return rec.status;
    if (
      wd !== null &&
      academyDays.includes(wd) &&
      (ACADEMY_SESSIONS as readonly number[]).includes(session)
    ) {
      return "academy";
    }
    return student!.is_independent ? "independent" : "present";
  }

  return (
    <>
      <Link href="/admin/students" className="text-sm text-neutral-500">
        ← 학생 관리
      </Link>

      <div className="mb-1 mt-2 flex items-center gap-2">
        <h1 className="text-lg font-semibold">
          <span className="mr-2 text-neutral-500">{seatNo(student.student_number) ?? "-"}</span>
          {student.name}
        </h1>
        {student.role === "admin" && (
          <span className="rounded-md bg-blue-900/60 px-2 py-0.5 text-xs text-blue-300">관리자</span>
        )}
        {student.is_independent && (
          <span className={`rounded-md border px-2 py-0.5 text-xs ${NS_STYLE.independent}`}>
            자주반
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-neutral-500">
        {student.google_email}
        {!student.auth_user_id && " · 아직 로그인하지 않음"} · 읽기 전용 화면이에요.
      </p>

      <div className="space-y-3">
        <PenaltyStatus total={cumulative} />

        <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
          <section className="rounded-2xl bg-surface p-5">
            <p className="text-sm text-neutral-500">총 미납액</p>
            <p className="mt-1 text-3xl font-bold text-red-400">{won(owingTotal)}</p>
            <p className="mt-2 text-xs text-neutral-500">누적 {won(cumulative)}</p>
          </section>

          <section className="rounded-2xl bg-surface p-5">
            <h2 className="font-medium">🌙 오늘 CIP</h2>
            <ul className="mt-2 space-y-1.5">
              {SESSIONS.map((n) => {
                const st = recs.get(n);
                const status = cipStatus(n);
                return (
                  <li key={n} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-neutral-400">{SESSION_LABEL[n]}</span>
                    <span className="truncate text-xs text-neutral-500">{st?.reason ?? ""}</span>
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${NS_STYLE[status]}`}>
                      {NS_LABEL[status]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              학원 요일: {academyDays.length ? academyDays.map((d) => DAYS[d]).join(", ") : "없음"}
            </p>
          </section>
        </div>

        <section className="rounded-2xl bg-surface p-5">
          <h2 className="mb-2 font-medium">🧾 입금 신청</h2>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {won(r.total_amount)}
                  <span className="ml-2 text-xs text-neutral-500">{r.depositor_name}</span>
                </span>
                <span className="text-xs text-neutral-500">{dt(r.reviewed_at)}</span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-xs ${
                    r.status === "approved"
                      ? "bg-green-950 text-green-300"
                      : r.status === "rejected"
                      ? "bg-red-950 text-red-300"
                      : "bg-amber-950 text-amber-300"
                  }`}
                >
                  {r.status === "approved" ? "승인" : r.status === "rejected" ? "거절" : "대기"}
                </span>
              </li>
            ))}
            {requests.length === 0 && (
              <li className="py-4 text-center text-sm text-neutral-500">신청 내역이 없어요.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-300">
            부과 내역 ({live.length}건)
          </h2>
          <ul className="space-y-2">
            {fines.map((f) => (
              <li
                key={f.id}
                className={`rounded-xl border-l-4 p-3.5 ${
                  f.deleted_at
                    ? "border-l-neutral-800 bg-surface opacity-50"
                    : f.status === "unpaid" || f.status === "doubled"
                    ? "border-l-red-500 bg-red-950/40"
                    : f.status === "pending_approval"
                    ? "border-l-amber-500 bg-amber-950/30"
                    : "border-l-neutral-700 bg-surface"
                }`}
              >
                <div className="flex justify-between">
                  <span className={`text-sm font-medium ${f.deleted_at ? "line-through" : ""}`}>
                    {FINE_TYPE_LABEL[f.type]}
                  </span>
                  <span className={`text-sm font-semibold ${f.deleted_at ? "line-through" : ""}`}>
                    {won(payable(f))}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {f.reason ? f.reason + " · " : ""}
                  {ko(f.occurred_date)} 부과
                </p>
                {f.deleted_at && (
                  <p className="mt-1 text-xs text-neutral-400">
                    취소됨{f.delete_reason ? ` · ${f.delete_reason}` : ""}
                  </p>
                )}
              </li>
            ))}
            {fines.length === 0 && (
              <li className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-neutral-500">
                부과된 벌금이 없어요.
              </li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}