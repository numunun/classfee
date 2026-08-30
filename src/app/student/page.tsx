import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/TopBar";
import { PageShell } from "@/components/PageShell";
import { StudentPayment } from "@/components/StudentPayment";
import { MealCard } from "@/components/MealCard";
import { PenaltyStatus } from "@/components/PenaltyStatus";
import { NoticeBoard } from "@/components/NoticeBoard";
import { ThemeBanner } from "@/components/ThemeBanner";
import { getTheme, themeCss } from "@/lib/themes";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { NightStudyReport, type SessionState } from "@/components/NightStudyReport";
import { FINE_TYPE_LABEL, payable, won, type Fine } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import {
  todayISO,
  weekdayIndex,
  SESSIONS,
  isCipDay,
  type NightStatus,
  type Session,
} from "@/lib/night-study";

function ko(d: string) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

export default async function StudentPage() {
  const me = await requireStudent();
  const supabase = createClient();
  const today = todayISO();
  const wd = weekdayIndex();

  const [{ data: finesData }, { data: rejectedData }, s] = await Promise.all([
    supabase
      .from("fines")
      .select("*")
      .eq("student_id", me.id)
      .order("occurred_date", { ascending: false }),
    supabase
      .from("payment_requests")
      .select("id, total_amount, reject_reason, reviewed_at")
      .eq("student_id", me.id)
      .eq("status", "rejected")
      .order("reviewed_at", { ascending: false })
      .limit(3),
    getSettings(),
  ]);

  const fines = (finesData ?? []) as Fine[];
  const rejected = (rejectedData ?? []) as {
    id: string;
    total_amount: number;
    reject_reason: string | null;
    reviewed_at: string | null;
  }[];

  // 오늘 CIP 상태 (1/2/3차). 기록이 없으면 학원 스케줄 > 자주반 > 참석 순으로 결정한다.
  const [{ data: nsData }, { data: acaData }] = await Promise.all([
    supabase
      .from("night_study_records")
      .select("session, status, reason, self_reported")
      .eq("student_id", me.id)
      .eq("study_date", today),
    wd
      ? supabase
          .from("academy_schedules")
          .select("session, note")
          .eq("student_id", me.id)
          .eq("weekday", wd)
      : Promise.resolve({ data: [] as { session: number; note: string | null }[] }),
  ]);

  const recs = new Map(
    ((nsData ?? []) as {
      session: number;
      status: NightStatus;
      reason: string | null;
      self_reported: boolean;
    }[]).map((r) => [r.session, r])
  );
  const acas = new Map(
    ((acaData ?? []) as { session: number; note: string | null }[]).map((a) => [a.session, a.note])
  );

  const cipStates: SessionState[] = SESSIONS.map((n) => {
    const rec = recs.get(n);
    if (rec) {
      return { session: n as Session, status: rec.status, reason: rec.reason, locked: !rec.self_reported };
    }
    if (acas.has(n)) {
      return { session: n as Session, status: "academy", reason: acas.get(n) ?? null, locked: false };
    }
    return {
      session: n as Session,
      status: me.is_independent ? "independent" : "present",
      reason: null,
      locked: false,
    };
  });

  if (!s) {
    return (
      <p className="p-6 text-sm text-neutral-400">
        설정을 불러올 수 없어요. 새로고침 해주세요.
      </p>
    );
  }

  // 취소된 건은 합계에서 빼고 목록에만 「취소됨」으로 남긴다.
  const live = fines.filter((f) => !f.deleted_at);
  const owing = live.filter((f) =>
    ["unpaid", "doubled", "pending_approval"].includes(f.status)
  );
  const owingTotal = owing.reduce((a, f) => a + payable(f), 0);
  const cumulativeTotal = live.reduce((a, f) => a + payable(f), 0);

  // 개인 커스텀 테마 (없으면 null → 기본 화면)
  const theme = getTheme(me.student_number);

  const selectable = live.filter((f) => f.status === "unpaid" || f.status === "doubled");
  const nextDue = selectable.map((f) => f.due_date).sort().at(0);

  return (
    <>
      {/* 배경은 PageShell 바깥에 둔다. 안에 두면 카드(position:static)보다 위에 그려져
          워터마크가 본문을 가린다. */}
      {theme && (
        <>
          <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
          <ThemeBackdrop theme={theme} />
        </>
      )}

      <PageShell>
        <TopBar title="내 학급" who={me.name} isAdmin={me.role === "admin"} here="student" />

        {theme && (
          <div className="mt-4">
            <ThemeBanner theme={theme} name={me.name} studentNumber={me.student_number} />
          </div>
        )}

      <div className="mt-3">
        <NoticeBoard />
      </div>

      <div className="mt-3">
        <PenaltyStatus total={cumulativeTotal} />
      </div>

      {rejected.map((r) => (
        <div
          key={r.id}
          className="mt-4 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3"
        >
          <p className="text-sm font-medium text-red-300">
            입금 신청이 거절됐어요 · {won(r.total_amount)}
          </p>
          <p className="mt-0.5 text-xs text-red-400/80">
            사유: {r.reject_reason || "사유가 기록되지 않았어요. 관리자에게 문의하세요."}
          </p>
        </div>
      ))}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-start">
        {isCipDay(wd) ? (
          <NightStudyReport states={cipStates} isIndependent={!!me.is_independent} />
        ) : (
          <section className="rounded-2xl bg-surface p-5">
            <h2 className="font-medium">🌙 오늘 CIP</h2>
            <p className="mt-2 text-sm text-neutral-500">
              오늘은 CIP 운영일이 아니에요. (월~목만 운영)
            </p>
          </section>
        )}
        <MealCard />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-start">
        <section className="rounded-2xl bg-surface p-5">
          <p className="text-sm text-neutral-500">총 미납액</p>
          <p className="mt-1 text-3xl font-bold text-red-400">{won(owingTotal)}</p>
          {nextDue && s.double_fine_enabled && (
            <p className="mt-2 text-sm text-neutral-400">
              🕐 {ko(nextDue)}까지 미납 시 2배로 인상
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-5">
          <p className="flex items-center gap-2 font-medium">🏦 납부 계좌</p>
          <p className="mt-2 text-sm">
            {s.account_bank} {s.account_number}
          </p>
          <p className="text-sm">예금주: {s.account_holder}</p>
          <p className="mt-2 text-xs text-neutral-500">
            입금자명은 반드시 본인 실명으로 입력
          </p>
        </section>
      </div>

      <div className="mt-3">
        <StudentPayment fines={selectable} myName={me.name} />
      </div>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-medium text-neutral-300">부과 내역</h2>
        <ul className="space-y-2">
          {fines.map((f) => {
            if (f.deleted_at) {
              return (
                <li key={f.id} className="rounded-xl border-l-4 border-l-neutral-800 bg-surface p-3.5 opacity-50">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium line-through">
                      {FINE_TYPE_LABEL[f.type]}
                    </span>
                    <span className="text-sm font-semibold line-through">{won(payable(f))}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {f.reason ? f.reason + " · " : ""}
                    {ko(f.occurred_date)} 부과
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">취소됨</p>
                </li>
              );
            }
            const tone =
              f.status === "unpaid" || f.status === "doubled"
                ? "border-l-red-500 bg-red-950/40"
                : f.status === "pending_approval"
                ? "border-l-amber-500 bg-amber-950/30"
                : "border-l-neutral-700 bg-surface";
            return (
              <li key={f.id} className={`rounded-xl border-l-4 p-3.5 ${tone}`}>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{FINE_TYPE_LABEL[f.type]}</span>
                  <span className="text-sm font-semibold">{won(payable(f))}</span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {f.reason ? f.reason + " · " : ""}
                  {ko(f.occurred_date)} 부과
                </p>
                <p className="mt-1 text-xs">
                  {f.status === "paid" && <span className="text-green-400">✓ 완납</span>}
                  {f.status === "pending_approval" && (
                    <span className="text-amber-400">입금 확인 대기 중</span>
                  )}
                  {(f.status === "unpaid" || f.status === "doubled") && (
                    <span className="text-red-400">{ko(f.due_date)}까지 미납</span>
                  )}
                </p>
              </li>
            );
          })}
          {fines.length === 0 && (
            <li className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-neutral-500">
              부과된 벌금이 없어요. 👍
            </li>
          )}
        </ul>
      </section>
      </PageShell>
    </>
  );
}