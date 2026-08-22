"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setNightStatus, saveAcademyDays, setIndependent } from "@/app/admin/night-study/actions";
import { useToast } from "@/components/Toast";
import {
  NS_LABEL, NS_STYLE, REASON_TYPES, SESSIONS, SESSION_LABEL, seatNo,
  type NightStatus, type Session,
} from "@/lib/night-study";

export type Row = {
  id: string;
  name: string;
  student_number: number | null;
  isIndependent: boolean;
  /** 차수별 현재 상태 */
  states: Record<number, { status: NightStatus; reason: string | null; selfReported: boolean }>;
  /** 차수별 학원 요일 */
  academy: Record<number, number[]>;
};

const DAYS = ["월", "화", "수", "목", "금"];
const CHOICES: NightStatus[] = ["present", ...REASON_TYPES];

function SessionTabs({ value, onChange }: { value: Session; onChange: (s: Session) => void }) {
  return (
    <div className="flex gap-1.5">
      {SESSIONS.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`h-9 rounded-lg px-3 text-xs font-medium ${
            value === n ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-400"
          }`}
        >
          {SESSION_LABEL[n]}
        </button>
      ))}
    </div>
  );
}

export function NightStudyAdmin({ rows, date }: { rows: Row[]; date: string }) {
  const [tab, setTab] = useState<"today" | "schedule">("today");
  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("today")}
          className={`h-11 rounded-xl px-4 text-sm font-medium ${
            tab === "today" ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-300"
          }`}
        >
          오늘 출결
        </button>
        <button
          onClick={() => setTab("schedule")}
          className={`h-11 rounded-xl px-4 text-sm font-medium ${
            tab === "schedule" ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-300"
          }`}
        >
          학원 · 자주반
        </button>
      </div>
      {tab === "today" ? <TodayList rows={rows} date={date} /> : <ScheduleList rows={rows} />}
    </>
  );
}

function TodayList({ rows, date }: { rows: Row[]; date: string }) {
  const [session, setSession] = useState<Session>(1);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function set(studentId: string, status: NightStatus, reason: string | null) {
    start(async () => {
      try {
        await setNightStatus(studentId, date, session, status, reason ?? undefined);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  const counts = CHOICES.reduce(
    (acc, c) => ({
      ...acc,
      [c]: rows.filter((r) => (r.states[session]?.status ?? "present") === c).length,
    }),
    {} as Record<string, number>
  );

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SessionTabs value={session} onChange={setSession} />
        <span className="text-xs text-neutral-500">
          참석 {counts.present + rows.filter((r) => r.isIndependent && !r.states[session]).length}
          {" / "}
          {rows.length}명
        </span>
      </div>

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {rows.map((r) => {
          const st = r.states[session];
          const status: NightStatus = st?.status ?? (r.isIndependent ? "independent" : "present");
          return (
            <li key={r.id} className="border-b border-line px-4 py-3 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="mr-2 text-neutral-500">{seatNo(r.student_number) ?? "-"}</span>
                    {r.name}
                    {st?.selfReported && (
                      <span className="ml-2 text-xs text-neutral-600">본인 신고</span>
                    )}
                  </p>
                  {st?.reason && <p className="truncate text-xs text-neutral-500">{st.reason}</p>}
                </div>
                <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${NS_STYLE[status]}`}>
                  {NS_LABEL[status]}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {CHOICES.map((c) => (
                  <button
                    key={c}
                    disabled={pending}
                    onClick={() => set(r.id, c, st?.reason ?? null)}
                    className={`h-9 rounded-lg border text-[11px] font-medium disabled:opacity-50 ${
                      status === c ? NS_STYLE[c] : "border-line bg-surface-2 text-neutral-400"
                    }`}
                  >
                    {NS_LABEL[c]}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ScheduleList({ rows }: { rows: Row[] }) {
  const [session, setSession] = useState<Session>(1);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, Record<number, number[]>>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, { ...r.academy }]))
  );

  function toggle(studentId: string, day: number) {
    setDraft((cur) => {
      const perSession = cur[studentId] ?? {};
      const days = perSession[session] ?? [];
      return {
        ...cur,
        [studentId]: {
          ...perSession,
          [session]: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
        },
      };
    });
  }

  function save(studentId: string) {
    start(async () => {
      try {
        await saveAcademyDays(studentId, session, draft[studentId]?.[session] ?? []);
        toast(`${SESSION_LABEL[session]} 학원 요일을 저장했어요.`);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  function toggleIndependent(studentId: string, value: boolean) {
    start(async () => {
      try {
        await setIndependent(studentId, value);
        toast(value ? "자주반으로 지정했어요." : "자주반을 해제했어요.");
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SessionTabs value={session} onChange={setSession} />
      </div>
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">
        학원 가는 요일을 차수별로 체크해두면, 그날 아무도 입력하지 않아도 자동으로 「학원」으로
        표시돼요. 자주반은 한 번 켜두면 매일 자동 적용돼요.
      </p>

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {rows.map((r) => {
          const days = draft[r.id]?.[session] ?? [];
          const saved = r.academy[session] ?? [];
          const dirty = JSON.stringify([...days].sort()) !== JSON.stringify([...saved].sort());
          return (
            <li key={r.id} className="border-b border-line px-4 py-3 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm">
                  <span className="mr-2 text-neutral-500">{seatNo(r.student_number) ?? "-"}</span>
                  {r.name}
                </p>
                <button
                  disabled={pending}
                  onClick={() => toggleIndependent(r.id, !r.isIndependent)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                    r.isIndependent ? NS_STYLE.independent : "border-line bg-surface-2 text-neutral-500"
                  }`}
                >
                  자주반
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {DAYS.map((label, i) => {
                  const day = i + 1;
                  const on = days.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggle(r.id, day)}
                      className={`h-9 flex-1 rounded-lg border text-xs font-medium ${
                        on ? NS_STYLE.academy : "border-line bg-surface-2 text-neutral-500"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                <button
                  disabled={pending || !dirty}
                  onClick={() => save(r.id)}
                  className="h-9 shrink-0 rounded-lg bg-white px-3 text-xs font-medium text-neutral-900 disabled:opacity-30"
                >
                  저장
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}