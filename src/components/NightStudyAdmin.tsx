"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setNightStatus,
  clearNightStatus,
  saveAcademyDays,
  setIndependent,
  setCipInactive,
} from "@/app/admin/night-study/actions";
import { useToast } from "@/components/Toast";
import {
  NS_LABEL,
  NS_STYLE,
  REASON_TYPES,
  REASON_PLACEHOLDER,
  SESSIONS,
  SESSION_LABEL,
  seatNo,
  resolveNight,
  isAcademySession,
  type NightStatus,
  type ReasonType,
  type Session,
  type NightRecord,
  type NightSource,
} from "@/lib/night-study";
import { matches } from "@/lib/hangul";

export type Row = {
  id: string;
  name: string;
  student_number: number | null;
  isIndependent: boolean;
  isInactive: boolean;
  states: Record<number, NightRecord>;
  /** 학원 가는 요일 (1=월 … 4=목). 차수는 2·3차로 고정 */
  academyDays: number[];
};

const DAYS = ["월", "화", "수", "목"];
const CHOICES: NightStatus[] = ["present", ...REASON_TYPES];

/** 현황판(board_snapshot)과 같은 우선순위로 상태를 정한다. */
function resolve(row: Row, session: Session, weekday: number | null) {
  return resolveNight({
    record: row.states[session],
    inactive: row.isInactive,
    academy: isAcademySession(weekday, row.academyDays, session),
    independent: row.isIndependent,
  });
}

/** 상태 옆에 붙이는 작은 꼬리표 */
const SOURCE_TAG: Partial<Record<NightSource, { text: string; cls: string }>> = {
  admin: { text: "관리자 지정", cls: "text-blue-400/70" },
  self: { text: "본인 신고", cls: "text-neutral-600" },
  academy: { text: "학원 요일", cls: "text-neutral-600" },
};

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
    ? rows.filter((r) => matches(r.name, q) || String(r.student_number ?? "").includes(q))
    : rows;

  // 비활성 학생은 CIP 대상이 아니므로 분모에서 뺀다 (관리자가 따로 지정한 경우는 대상으로 본다)
  const resolved = rows.map((r) => resolve(r, session, weekday).status);
  const targets = resolved.filter((st) => st !== "inactive").length;
  const attending = resolved.filter((st) => st === "present").length;
  const inactiveCount = rows.length - targets;

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <SessionTabs value={session} onChange={setSession} />
        <span className="text-xs text-neutral-500">
          참석 {attending} / {targets}명
          {inactiveCount > 0 && <span className="ml-1.5 text-neutral-600">· 비활성 {inactiveCount}</span>}
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
  const { status, source } = resolve(row, session, weekday);
  const hasRecord = !!st;
  // 비활성(source = inactive)일 때는 꼬리표 없이 「비활성화」 배지만 보인다
  const tag = SOURCE_TAG[source];

  const [draft, setDraft] = useState<ReasonType | null>(null);
  const [reason, setReason] = useState(st?.reason ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function apply(next: NightStatus, why: string) {
    start(async () => {
      const res = await setNightStatus(row.id, date, session, next, why);
      if (!res.ok) {
        toast(res.message, "error");
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  function clear() {
    start(async () => {
      const res = await clearNightStatus(row.id, date, session);
      if (!res.ok) {
        toast(res.message, "error");
        return;
      }
      setDraft(null);
      router.refresh();
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
    <li
      className={`border-b border-line px-4 py-3 last:border-0 ${
        status === "inactive" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            <span className="mr-2 text-neutral-500">{seatNo(row.student_number) ?? "-"}</span>
            {row.name}
            {tag && <span className={`ml-2 text-xs ${tag.cls}`}>{tag.text}</span>}
            {row.isInactive && source === "admin" && (
              <span className="ml-2 text-xs text-neutral-600">비활성 학생</span>
            )}
          </p>
          {st?.reason && !draft && status !== "inactive" && (
            <p className="truncate text-xs text-neutral-500">{st.reason}</p>
          )}
          {status === "inactive" && st?.selfReported && (
            <p className="truncate text-xs text-neutral-600">
              비활성 전에 남은 신고({NS_LABEL[st.status]})는 반영되지 않아요.
            </p>
          )}
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
      const res = await saveAcademyDays(studentId, draft[studentId] ?? []);
      if (!res.ok) {
        toast(res.message, "error");
        return;
      }
      toast("학원 요일을 저장했어요.");
      router.refresh();
    });
  }

  function toggleIndependent(studentId: string, value: boolean) {
    start(async () => {
      const res = await setIndependent(studentId, value);
      if (!res.ok) {
        toast(res.message, "error");
        return;
      }
      toast(value ? "자주반으로 지정했어요." : "자주반을 해제했어요.");
      router.refresh();
    });
  }

  function toggleInactive(studentId: string, value: boolean) {
    start(async () => {
      const res = await setCipInactive(studentId, value);
      if (!res.ok) {
        toast(res.message, "error");
        return;
      }
      toast(value ? "CIP 비활성화했어요." : "CIP 대상으로 되돌렸어요.");
      router.refresh();
    });
  }

  return (
    <>
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">
        학원 가는 요일을 체크해두면 그날 <span className="text-neutral-300">2차·3차</span>가 자동으로
        「학원」이 돼요. 1차는 참석이에요. 자주반은 한 번 켜두면 매일 적용되고, 학원 가는 날에는
        학원이 우선해요. 「비활성」은 CIP 자체를 하지 않는 학생이에요. 학생 신고와 전자칠판
        수정이 막히고, 관리자가 직접 지정한 기록만 표시돼요.
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
                <div className="flex shrink-0 gap-1.5">
                  <button
                    disabled={pending}
                    onClick={() => toggleIndependent(r.id, !r.isIndependent)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                      r.isIndependent
                        ? NS_STYLE.independent
                        : "border-line bg-surface-2 text-neutral-500"
                    }`}
                  >
                    자주반
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => toggleInactive(r.id, !r.isInactive)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                      r.isInactive
                        ? NS_STYLE.inactive
                        : "border-line bg-surface-2 text-neutral-500"
                    }`}
                  >
                    비활성
                  </button>
                </div>
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