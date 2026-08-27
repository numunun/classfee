"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setNightStatus,
  clearNightStatus,
  saveAcademyDays,
  setIndependent,
} from "@/app/admin/night-study/actions";
import { useToast } from "@/components/Toast";
import {
  NS_LABEL,
  NS_STYLE,
  REASON_TYPES,
  REASON_PLACEHOLDER,
  SESSIONS,
  SESSION_LABEL,
  ACADEMY_SESSIONS,
  seatNo,
  type NightStatus,
  type ReasonType,
  type Session,
} from "@/lib/night-study";

export type Row = {
  id: string;
  name: string;
  student_number: number | null;
  isIndependent: boolean;
  states: Record<number, { status: NightStatus; reason: string | null; selfReported: boolean }>;
  /** 학원 가는 요일 (1=월 … 4=목). 차수는 2·3차로 고정 */
  academyDays: number[];
};

const DAYS = ["월", "화", "수", "목"];
const CHOICES: NightStatus[] = ["present", ...REASON_TYPES];

/**
 * 기록이 없을 때의 기본 상태.
 * 우선순위: 당일 기록 > 학원 스케줄 > 자주반 > 참석
 * 학원이 자주반보다 앞선다 (학원 가는 날은 자주반도 안 가므로).
 */
function resolve(row: Row, session: Session, weekday: number | null): NightStatus {
  const rec = row.states[session];
  if (rec) return rec.status;
  const isAcademy =
    weekday !== null &&
    row.academyDays.includes(weekday) &&
    (ACADEMY_SESSIONS as readonly number[]).includes(session);
  if (isAcademy) return "academy";
  if (row.isIndependent) return "independent";
  return "present";
}

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

export function NightStudyAdmin({
  rows,
  date,
  weekday,
}: {
  rows: Row[];
  date: string;
  weekday: number | null;
}) {
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
      {tab === "today" ? (
        <TodayList rows={rows} date={date} weekday={weekday} />
      ) : (
        <ScheduleList rows={rows} />
      )}
    </>
  );
}

function TodayList({
  rows,
  date,
  weekday,
}: {
  rows: Row[];
  date: string;
  weekday: number | null;
}) {
  const [session, setSession] = useState<Session>(1);
  const [query, setQuery] = useState("");

  const q = query.trim();
  const shown = q
    ? rows.filter((r) => r.name.includes(q) || String(r.student_number ?? "").includes(q))
    : rows;

  const attending = rows.filter((r) => resolve(r, session, weekday) === "present").length;

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SessionTabs value={session} onChange={setSession} />
        <span className="text-xs text-neutral-500">
          참석 {attending} / {rows.length}명
        </span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 번호로 찾기"
        className="mb-3"
      />

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {shown.map((r) => (
          <StudentRow
            key={r.id + session}
            row={r}
            session={session}
            date={date}
            weekday={weekday}
          />
        ))}
        {shown.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-neutral-500">찾는 학생이 없어요.</li>
        )}
      </ul>
    </>
  );
}

function StudentRow({
  row,
  session,
  date,
  weekday,
}: {
  row: Row;
  session: Session;
  date: string;
  weekday: number | null;
}) {
  const st = row.states[session];
  const status = resolve(row, session, weekday);
  const hasRecord = !!st;

  const [draft, setDraft] = useState<ReasonType | null>(null);
  const [reason, setReason] = useState(st?.reason ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function apply(next: NightStatus, why: string) {
    start(async () => {
      try {
        await setNightStatus(row.id, date, session, next, why);
        setDraft(null);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  function clear() {
    start(async () => {
      try {
        await clearNightStatus(row.id, date, session);
        setDraft(null);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  function pick(c: NightStatus) {
    // 참석은 사유가 필요 없으니 바로 반영, 나머지는 사유 입력을 연다.
    if (c === "present") {
      apply("present", "");
      return;
    }
    setDraft(c as ReasonType);
    setReason(st?.reason ?? "");
  }

  return (
    <li className="border-b border-line px-4 py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            <span className="mr-2 text-neutral-500">{seatNo(row.student_number) ?? "-"}</span>
            {row.name}
            {st?.selfReported && <span className="ml-2 text-xs text-neutral-600">본인 신고</span>}
            {hasRecord && !st?.selfReported && (
              <span className="ml-2 text-xs text-blue-400/70">관리자 지정</span>
            )}
            {!hasRecord && status === "academy" && (
              <span className="ml-2 text-xs text-neutral-600">학원 요일</span>
            )}
          </p>
          {st?.reason && !draft && <p className="truncate text-xs text-neutral-500">{st.reason}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-xs ${NS_STYLE[status]}`}>
            {NS_LABEL[status]}
          </span>
          {hasRecord && (
            <button
              disabled={pending}
              onClick={clear}
              title="기록을 지워 기본값으로 되돌립니다"
              className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-neutral-500 disabled:opacity-50"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {CHOICES.map((c) => (
          <button
            key={c}
            disabled={pending}
            onClick={() => pick(c)}
            className={`h-9 rounded-lg border text-[11px] font-medium disabled:opacity-50 ${
              (draft ?? status) === c ? NS_STYLE[c] : "border-line bg-surface-2 text-neutral-400"
            }`}
          >
            {NS_LABEL[c]}
          </button>
        ))}
      </div>

      {draft && (
        <div className="mt-2 flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={REASON_PLACEHOLDER[draft]}
            autoFocus
            className="flex-1"
          />
          <button
            disabled={pending}
            onClick={() => apply(draft, reason)}
            className="h-[2.875rem] shrink-0 rounded-xl bg-white px-4 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            저장
          </button>
          <button
            disabled={pending}
            onClick={() => setDraft(null)}
            className="h-[2.875rem] shrink-0 rounded-xl bg-surface-2 px-3 text-sm text-neutral-400 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      )}
    </li>
  );
}

function ScheduleList({ rows }: { rows: Row[] }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, [...r.academyDays]]))
  );

  function toggle(studentId: string, day: number) {
    setDraft((cur) => {
      const days = cur[studentId] ?? [];
      return {
        ...cur,
        [studentId]: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
      };
    });
  }

  function save(studentId: string) {
    start(async () => {
      try {
        await saveAcademyDays(studentId, draft[studentId] ?? []);
        toast("학원 요일을 저장했어요.");
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
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">
        학원 가는 요일을 체크해두면 그날 <span className="text-neutral-300">2차·3차</span>가 자동으로
        「학원」이 돼요. 1차는 참석이에요. 자주반은 한 번 켜두면 매일 적용되고, 학원 가는 날에는
        학원이 우선해요.
      </p>

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {rows.map((r) => {
          const days = draft[r.id] ?? [];
          const dirty =
            JSON.stringify([...days].sort()) !== JSON.stringify([...r.academyDays].sort());
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
                    r.isIndependent
                      ? NS_STYLE.independent
                      : "border-line bg-surface-2 text-neutral-500"
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