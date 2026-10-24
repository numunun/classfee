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
import { UnpaidAlert } from "@/components/UnpaidAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { CardTitle } from "@/components/CardTitle";
import { CopyButton } from "@/components/CopyButton";
import { PageHeader } from "@/components/PageHeader";
import { CircleCheck, CircleX, Landmark, Moon } from "lucide-react";
import { TermsGate } from "@/components/TermsGate";
import { TERMS_VERSION } from "@/lib/terms";
import { FINE_TYPE_LABEL, payable, won, type Fine, type Student } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import {
  todayISO,
  weekdayIndex,
  SESSIONS,
  SESSION_LABEL,
  NS_LABEL,
  NS_STYLE,
  isCipDay,
  isReportOpen,
  resolveNight,
  type NightStatus,
  type Session,
} from "@/lib/night-study";

function ko(d: string) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

export async function StudentView({
  me,
  readOnly = false,
}: {
  me: Student;
  /** 관리자 미리보기. 버튼을 눌러도 동작하지 않도록 정적 표시로 바꾼다. */
  readOnly?: boolean;
}) {
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

  // 오늘 CIP 상태 (1/2/3차). 우선순위는 현황판과 같다.
  // 관리자 기록 > 비활성화 > 본인 신고 > 학원 > 자주반 > 참석
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

  const inactive = !!me.cip_inactive;
  const cipStates: SessionState[] = SESSIONS.map((n) => {
    const rec = recs.get(n);
    const r = resolveNight({
      record: rec
        ? { status: rec.status, reason: rec.reason, selfReported: rec.self_reported }
        : null,
      inactive,
      academy: acas.has(n),
      academyNote: acas.get(n) ?? null,
      independent: !!me.is_independent,
    });
    return {
      session: n as Session,
      status: r.status,
      reason: r.reason,
      locked: r.source === "admin",
    };
  });
  // 비활성 학생이라도 관리자가 따로 지정한 차수가 있으면 보여준다
  const inactiveOverrides = cipStates.filter((st) => st.status !== "inactive");

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
  const pendingCount = owing.filter((f) => f.status === "pending_approval").length;
  const cumulativeTotal = live.reduce((a, f) => a + payable(f), 0);

  // 개인 커스텀 테마 (없으면 null → 기본 화면)
  const theme = getTheme(me.student_number);

  const selectable = live.filter((f) => f.status === "unpaid" || f.status === "doubled");
  // 연체 2배는 지각 누진제 시행일 이전에 부과된 건에만 붙는다 (0023)
  const hasDoublable = selectable.some(
    (f) => !s.late_policy_start || f.occurred_date < s.late_policy_start
  );

  return (
    <>
      {/* 테마가 없어도 기본값을 실어 보낸다. 그래야 관리자 미리보기에서
          이전 화면(관리자 본인 테마)의 색이 남지 않는다. */}
      <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
      {theme && <ThemeBackdrop theme={theme} />}

      {/* 아직 동의하지 않았거나 약관이 바뀌었으면 관문을 띄운다.
          관리자 미리보기(readOnly)에서는 띄우지 않는다. */}
      {!readOnly && me.terms_version !== TERMS_VERSION && <TermsGate />}

      <PageShell>
        {readOnly ? (
          <PageHeader
            back={{ href: "/admin/students", label: "학생 관리" }}
            title={`${me.name} 님의 화면`}
            description="관리자 미리보기예요. 버튼은 동작하지 않아요."
            className="mb-0"
          />
        ) : (
          <TopBar title="내 학급" who={`${me.name} 님`} isAdmin={me.role === "admin"} here="student" />
        )}

        {theme && (
          <div className="mt-5">
            <ThemeBanner theme={theme} name={me.name} studentNumber={me.student_number} />
          </div>
        )}

        <div className="mt-4 space-y-3">
          <NoticeBoard />

          {rejected.map((r) => (
            <div key={r.id} className="flex gap-2.5 rounded-2xl bg-red-500/10 px-4 py-3.5">
              <CircleX className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-400">
                  입금 신청이 거절됐어요 · {won(r.total_amount)}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  사유: {r.reject_reason || "사유가 기록되지 않았어요. 관리자에게 문의하세요."}
                </p>
              </div>
            </div>
          ))}

          {/* 내야 할 벌금 — 금액, 상황 한 줄, 납부 버튼, 계좌를 한 카드에 모은다 */}
          <section className="rounded-3xl bg-surface p-5">
            <p className="text-sm font-medium text-neutral-500">내야 할 벌금</p>
            <p
              className={`mt-1 text-[2.25rem] font-bold leading-tight tabular-nums ${
                owingTotal > 0 ? "text-neutral-100" : "text-neutral-400"
              }`}
            >
              {won(owingTotal)}
            </p>
            <div className="mt-2">
              <UnpaidAlert fines={selectable} pendingCount={pendingCount} />
            </div>
            {hasDoublable && s.double_fine_enabled && (
              <p className="mt-1 text-xs text-neutral-500">
                {s.late_policy_start
                  ? `${ko(s.late_policy_start)} 전에 부과된 건은 기한을 넘기면 2배가 돼요`
                  : "기한을 넘긴 건은 2배가 돼요"}
              </p>
            )}

            <div className="mt-4 empty:hidden">
              <PenaltyStatus total={cumulativeTotal} />
            </div>

            {!readOnly && selectable.length > 0 && (
              <div className="mt-4">
                <StudentPayment
                  fines={selectable}
                  myName={me.name}
                  isCollector={s.collector_student_number === me.student_number}
                />
              </div>
            )}

            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <span className="icon-tile">
                <Landmark className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-500">{s.account_bank}</p>
                <p className="text-sm font-semibold tabular-nums">{s.account_number}</p>
                <p className="text-xs text-neutral-500">
                  예금주 {s.account_holder} · 입금자명은 본인 실명으로
                </p>
              </div>
              {!readOnly && s.account_number && <CopyButton text={s.account_number} />}
            </div>
          </section>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-start">
          {inactive ? (
            // 비활성 학생은 요일·시각과 상관없이 항상 이 카드를 보여준다.
            // (운영일이 아니거나 21시가 지나도 「비활성」임이 드러나야 한다)
            <section className="rounded-3xl bg-surface p-5">
              <CardTitle
                icon={Moon}
                right={<span className={`pill border ${NS_STYLE.inactive}`}>{NS_LABEL.inactive}</span>}
              >
                오늘 CIP
              </CardTitle>
              <p className="mt-3 text-sm text-neutral-500">
                CIP 참여 대상이 아니에요. 따로 신고하지 않아도 돼요.
              </p>
              {isCipDay(wd) && inactiveOverrides.length > 0 && (
                <>
                  <SessionList states={inactiveOverrides} />
                  <p className="mt-2 text-xs text-neutral-500">관리자가 따로 지정한 기록이에요.</p>
                </>
              )}
            </section>
          ) : isCipDay(wd) && !readOnly && isReportOpen() ? (
            <NightStudyReport states={cipStates} isIndependent={!!me.is_independent} />
          ) : readOnly || (isCipDay(wd) && !isReportOpen()) ? (
            <section className="rounded-3xl bg-surface p-5">
              <CardTitle icon={Moon}>오늘 CIP</CardTitle>
              <SessionList states={cipStates} />
              {!readOnly && (
                <p className="mt-3 text-xs text-neutral-500">
                  오늘 신고는 마감됐어요. (21시까지) 수정이 필요하면 관리자에게 말해주세요.
                </p>
              )}
            </section>
          ) : (
            <section className="rounded-3xl bg-surface p-5">
              <CardTitle icon={Moon}>오늘 CIP</CardTitle>
              <p className="mt-3 text-sm text-neutral-500">
                오늘은 CIP 운영일이 아니에요. (월~목만 운영)
              </p>
            </section>
          )}
          <MealCard />
        </div>

        <section className="mt-7">
          <div className="mb-2.5 flex items-baseline justify-between px-1">
            <h2 className="font-semibold">부과 내역</h2>
            {live.length > 0 && (
              <span className="text-xs text-neutral-500">
                누적 {won(cumulativeTotal)} · {live.length}건
              </span>
            )}
          </div>
          {live.length === 0 ? (
            <div className="rounded-3xl bg-surface px-4 py-10 text-center">
              <CircleCheck className="mx-auto size-8 text-green-400" aria-hidden />
              <p className="mt-2 text-sm text-neutral-500">부과된 벌금이 없어요.</p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-3xl bg-surface">
              {live.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      {FINE_TYPE_LABEL[f.type]}
                      {f.reason && f.reason !== FINE_TYPE_LABEL[f.type] && (
                        <span className="truncate font-normal text-neutral-500">· {f.reason}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {ko(f.occurred_date)} 부과
                      {(f.status === "unpaid" || f.status === "doubled") &&
                        ((f.overdue_multiplier ?? 1) > 1 ? (
                          <span className="text-red-400"> · 기한 초과 {f.overdue_multiplier}배</span>
                        ) : (
                          <> · {ko(f.due_date)}까지</>
                        ))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`text-[0.9375rem] font-bold tabular-nums ${
                        f.status === "paid" ? "text-neutral-500" : ""
                      }`}
                    >
                      {won(payable(f))}
                    </span>
                    <StatusBadge status={f.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageShell>
    </>
  );
}

/** 차수별 CIP 상태 목록 (읽기 전용) */
function SessionList({ states }: { states: SessionState[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {states.map((st) => (
        <li key={st.session} className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-neutral-300">{SESSION_LABEL[st.session]}</span>
          <span className="min-w-0 flex-1 truncate text-right text-xs text-neutral-500">
            {st.reason ?? ""}
          </span>
          <span className={`shrink-0 pill border ${NS_STYLE[st.status]}`}>
            {NS_LABEL[st.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
