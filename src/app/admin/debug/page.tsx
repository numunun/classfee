import Link from "next/link";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fetchMeals } from "@/lib/neis";
import {
  SESSION_TIME,
  SESSION_LABEL,
  SESSIONS,
  liveSessionAt,
  seoulMinutesOfDay,
} from "@/lib/night-study";

export const dynamic = "force-dynamic";
export const metadata = { title: "진단" };

type Row = { label: string; ok: boolean | null; value: string };

function Mark({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-neutral-600">•</span>;
  return ok ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>;
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="rounded-2xl bg-surface p-4">
      <h2 className="mb-3 text-sm font-medium text-neutral-200">{title}</h2>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-baseline gap-2 text-sm">
            <Mark ok={r.ok} />
            <span className="shrink-0 text-neutral-400">{r.label}</span>
            <span className="ml-auto break-all text-right font-mono text-xs text-neutral-300">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 값 자체는 절대 노출하지 않고 설정 여부와 길이만 보여준다 */
function mask(v: string | undefined): Row["value"] {
  if (!v) return "없음";
  return `설정됨 (${v.length}자)`;
}

export default async function DebugPage() {
  const supabase = createClient();

  // 1) 환경변수 — 값은 마스킹
  const env: Row[] = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "없음",
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      value: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    {
      label: "NEXT_PUBLIC_SCHOOL_DOMAIN",
      ok: !!process.env.NEXT_PUBLIC_SCHOOL_DOMAIN,
      value: process.env.NEXT_PUBLIC_SCHOOL_DOMAIN || "없음 (도메인 검증 꺼짐)",
    },
    {
      label: "NEIS_API_KEY",
      ok: !!process.env.NEIS_API_KEY,
      value: mask(process.env.NEIS_API_KEY),
    },
  ];

  // 2) DB 진단 RPC
  const { data: rep, error: repError } = await supabase.rpc("debug_report");
  const R = (rep ?? {}) as Record<string, any>;

  // 3) 익명 접근(전자칠판) 실제 호출 테스트
  const anon = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const boardTest = await anon.rpc("board_snapshot", {
    p_grade: 2,
    p_class: 9,
    p_session: 1,
    p_code: "",
  });

  // 4) 급식 실제 호출 테스트
  const meal = await fetchMeals();

  // 5) 시간 / CIP 차수
  const mins = seoulMinutesOfDay();
  const live = liveSessionAt(mins);
  const hh = String(Math.floor(mins / 60)).padStart(2, "0");
  const mm = String(mins % 60).padStart(2, "0");

  const timeRows: Row[] = [
    { label: "앱 서버 (한국)", ok: null, value: `${hh}:${mm}` },
    { label: "DB 서버 (UTC)", ok: null, value: R.now_utc ?? "-" },
    { label: "DB 서버 (한국)", ok: null, value: R.now_seoul ?? "-" },
    {
      label: "현재 CIP 차수",
      ok: null,
      value: live ? `${SESSION_LABEL[live]} 진행 중` : "운영 시간 아님",
    },
    ...SESSIONS.map((n) => ({
      label: `${SESSION_LABEL[n]} 시간`,
      ok: null,
      value: SESSION_TIME[n].label,
    })),
  ];

  const funcs = (R.functions ?? {}) as Record<string, boolean>;
  const funcRows: Row[] = Object.keys(funcs).map((k) => ({
    label: k,
    ok: funcs[k],
    value: funcs[k] ? "있음" : "없음 — 마이그레이션 확인",
  }));

  const rls = (R.rls ?? {}) as Record<string, boolean>;
  const rlsRows: Row[] = Object.keys(rls)
    .sort()
    .map((k) => ({ label: k, ok: rls[k], value: rls[k] ? "켜짐" : "꺼짐 ⚠️" }));

  const c = (R.counts ?? {}) as Record<string, number>;
  const countRows: Row[] = [
    { label: "학생 수", ok: null, value: `${c.students ?? 0}명` },
    { label: "관리자", ok: (c.admins ?? 0) > 0, value: `${c.admins ?? 0}명` },
    { label: "미로그인 학생", ok: null, value: `${c.students_unlinked ?? 0}명` },
    { label: "자기등록 학생", ok: null, value: `${c.students_self ?? 0}명` },
    { label: "자주반", ok: null, value: `${c.independent ?? 0}명` },
    { label: "벌금 (유효)", ok: null, value: `${c.fines ?? 0}건` },
    { label: "벌금 (미납)", ok: null, value: `${c.fines_unpaid ?? 0}건` },
    { label: "벌금 (삭제됨)", ok: null, value: `${c.fines_deleted ?? 0}건` },
    { label: "입금 승인 대기", ok: null, value: `${c.payment_pending ?? 0}건` },
    { label: "오늘 CIP 기록", ok: null, value: `${c.ns_today ?? 0}건` },
    { label: "학원 스케줄", ok: null, value: `${c.academy ?? 0}건` },
  ];

  const cron = R.cron;
  const cronRows: Row[] = Array.isArray(cron)
    ? cron.length > 0
      ? cron.map((j: any) => ({
          label: j.job,
          ok: j.active,
          value: `${j.schedule} (UTC)`,
        }))
      : [{ label: "등록된 작업", ok: false, value: "없음 — 2배 인상 자동화 안 됨" }]
    : [{ label: "pg_cron", ok: false, value: "확장 미설치" }];

  const s = (R.settings ?? {}) as Record<string, any>;
  const settingRows: Row[] = [
    { label: "학급 이름", ok: null, value: s.class_label ?? "-" },
    { label: "은행 / 예금주", ok: null, value: `${s.account_bank ?? "-"} / ${s.account_holder ?? "-"}` },
    { label: "계좌번호", ok: null, value: "가려짐" },
    { label: "납부 기한", ok: null, value: `${s.payment_deadline_days ?? "-"}일` },
    { label: "2배 인상", ok: null, value: s.double_fine_enabled ? "켜짐" : "꺼짐" },
    { label: "지각 / 청소", ok: null, value: `${s.late_fine_amount ?? "-"} / ${s.cleaning_fine_amount ?? "-"}원` },
    { label: "NEIS 코드", ok: !!s.neis_school_code, value: `${s.neis_atpt_code ?? "-"} / ${s.neis_school_code || "없음"}` },
    {
      label: "현황판 접근 코드",
      ok: null,
      value: R.board_code_set ? "설정됨 (공개 제한)" : "없음 (URL 만 알면 열람 가능)",
    },
  ];

  const externalRows: Row[] = [
    {
      label: "전자칠판 익명 조회",
      ok: !boardTest.error,
      value: boardTest.error ? boardTest.error.message : `${(boardTest.data ?? []).length}명 반환`,
    },
    {
      label: "NEIS 급식",
      ok: meal.ok,
      value: meal.ok
        ? `${meal.day.date} · ${meal.day.meals.map((m) => m.type).join(", ")}`
        : meal.reason + (meal.message ? ` (${meal.message})` : ""),
    },
  ];

  const unlinked = (R.unlinked_list ?? []) as { no: number; name: string }[];

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">
        ← 대시보드
      </Link>
      <h1 className="mb-1 mt-2 text-lg font-semibold">🩺 진단</h1>
      <p className="mb-4 text-xs text-neutral-500">
        관리자만 볼 수 있어요. 키와 계좌번호는 값이 표시되지 않아요.
      </p>

      {repError && (
        <div className="mb-4 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          DB 진단 실패: {repError.message}
          <p className="mt-1 text-xs text-red-400/70">
            0010 마이그레이션을 실행했는지 확인해 주세요.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Section title="환경변수" rows={env} />
        <Section title="외부 연동" rows={externalRows} />
        <Section title="시간 / CIP 차수" rows={timeRows} />
        <Section title="데이터 현황" rows={countRows} />
        <Section title="자동 실행 (pg_cron)" rows={cronRows} />
        <Section title="설정값" rows={settingRows} />
        <Section title="DB 함수" rows={funcRows} />
        <Section title="RLS (테이블 보안)" rows={rlsRows} />

        {unlinked.length > 0 && (
          <section className="rounded-2xl bg-surface p-4">
            <h2 className="mb-2 text-sm font-medium text-neutral-200">
              아직 로그인하지 않은 학생 ({unlinked.length}명)
            </h2>
            <p className="text-xs text-neutral-500">
              {unlinked.map((u) => `${u.no ?? "-"} ${u.name}`).join(" · ")}
            </p>
          </section>
        )}
      </div>
    </>
  );
}