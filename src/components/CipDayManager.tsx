"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Trash2 } from "lucide-react";
import { saveCipDay, deleteCipDay } from "@/app/admin/night-study/actions";
import { useToast } from "@/components/Toast";
import { CardTitle } from "@/components/CardTitle";
import { SESSIONS, SESSION_LABEL, weekdayIndex, isCipDay, type Session } from "@/lib/night-study";
import { describeCipDay } from "@/lib/cip-day";

export type CipDayRow = { day: string; sessions: number[]; note: string | null };

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function label(day: string): string {
  const d = new Date(day + "T12:00:00+09:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
}

/**
 * CIP 특별 일정 관리.
 * 날짜를 고르고 그날 운영할 차수만 켠다. 하나도 안 켜면 그날 CIP 전체 휴무.
 * 원래 쉬는 금요일에 CIP를 여는 것도 같은 방식으로 적는다.
 */
export function CipDayManager({ rows, today }: { rows: CipDayRow[]; today: string }) {
  const [day, setDay] = useState(today);
  const [open, setOpen] = useState<Session[]>([]);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const usual = isCipDay(weekdayIndex(new Date(day + "T12:00:00+09:00")));
  const summary = describeCipDay({ sessions: open, note: null, special: true });

  function toggle(n: Session) {
    setOpen((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort()));
  }

  function save() {
    start(async () => {
      const res = await saveCipDay(day, open, note);
      if (!res.ok) return toast(res.message, "error");
      toast(`${label(day)} 일정을 저장했어요.`);
      setNote("");
      router.refresh();
    });
  }

  function remove(target: string) {
    start(async () => {
      const res = await deleteCipDay(target);
      if (!res.ok) return toast(res.message, "error");
      toast(`${label(target)} 일정을 지웠어요. 원래대로 운영해요.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <section className="rounded-3xl bg-surface p-5">
        <CardTitle icon={CalendarOff}>특별 일정 추가</CardTitle>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          시험·행사로 CIP를 쉬거나 일부 차수만 하는 날을 적어요. 운영할 차수만 켜고, 하나도 안
          켜면 그날은 CIP가 없어요.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cip-day">날짜</label>
            <input
              id="cip-day"
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <label htmlFor="cip-note">사유 (선택)</label>
            <input
              id="cip-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 중간고사"
              maxLength={40}
              className="mt-1.5"
            />
          </div>
        </div>

        <p className="mt-4 text-[0.8125rem] font-medium text-neutral-400">운영할 차수</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {SESSIONS.map((n) => {
            const on = open.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                aria-pressed={on}
                className={`press h-11 rounded-xl text-sm font-semibold ${
                  on ? "btn-primary" : "bg-surface-2 text-neutral-500"
                }`}
              >
                {SESSION_LABEL[n]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {open.length === 0
            ? "이날은 CIP가 없어요."
            : `이날은 ${summary.replace(" 운영", "")} 운영해요.`}
          {!usual && open.length > 0 && " (원래 쉬는 요일이지만 이날만 열어요)"}
        </p>

        <button onClick={save} disabled={pending} className="btn btn-primary press mt-4 w-full">
          {pending ? "저장 중…" : "저장"}
        </button>
      </section>

      <section>
        <h2 className="mb-2.5 px-1 font-semibold">다가오는 특별 일정</h2>
        {rows.length === 0 ? (
          <p className="rounded-3xl bg-surface px-4 py-8 text-center text-sm text-neutral-500">
            적어 둔 일정이 없어요. 월~목은 평소대로 1~3차 모두 운영해요.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-3xl bg-surface">
            {rows.map((r) => {
              const off = r.sessions.length === 0;
              return (
                <li
                  key={r.day}
                  className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-semibold">
                      {label(r.day)}
                      {r.day === today && (
                        <span className="pill ml-2 bg-blue-500/15 text-blue-300">오늘</span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      <span className={off ? "font-medium text-red-400" : "font-medium text-amber-400"}>
                        {describeCipDay({ sessions: r.sessions as Session[], note: null, special: true })}
                      </span>
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(r.day)}
                    disabled={pending}
                    aria-label={`${label(r.day)} 일정 지우기`}
                    className="press grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-neutral-400 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
