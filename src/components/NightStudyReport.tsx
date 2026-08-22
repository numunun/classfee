"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportNightStudy } from "@/app/student/actions";
import { useToast } from "@/components/Toast";
import {
  NS_LABEL, NS_STYLE, REASON_TYPES, REASON_PLACEHOLDER,
  SESSIONS, SESSION_LABEL,
  type NightStatus, type ReasonType, type Session,
} from "@/lib/night-study";

export type SessionState = {
  session: Session;
  status: NightStatus;
  reason: string | null;
  locked: boolean; // 관리자가 처리함
};

export function NightStudyReport({
  states,
  isIndependent,
}: {
  states: SessionState[];
  isIndependent: boolean;
}) {
  return (
    <section className="rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">🌙 오늘 CIP</h2>
        {isIndependent && (
          <span className={`rounded-md border px-2 py-0.5 text-xs ${NS_STYLE.independent}`}>
            자주반
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">
        기본은 참석이에요. 빠지는 차수만 사유를 골라주세요.
      </p>

      <div className="mt-4 space-y-3">
        {SESSIONS.map((n) => {
          const st = states.find((s) => s.session === n);
          return (
            <SessionRow
              key={n}
              session={n}
              status={st?.status ?? (isIndependent ? "independent" : "present")}
              reason={st?.reason ?? null}
              locked={st?.locked ?? false}
            />
          );
        })}
      </div>
    </section>
  );
}

function SessionRow({
  session, status, reason, locked,
}: {
  session: Session;
  status: NightStatus;
  reason: string | null;
  locked: boolean;
}) {
  const attending = status === "present" || status === "independent";
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<ReasonType>(
    REASON_TYPES.includes(status as ReasonType) ? (status as ReasonType) : "academy"
  );
  const [text, setText] = useState(reason ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function submit(nextStatus: string, nextReason: string) {
    start(async () => {
      try {
        await reportNightStudy(session, nextStatus, nextReason);
        toast(`${SESSION_LABEL[session]} 출결을 등록했어요.`);
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-neutral-200">{SESSION_LABEL[session]}</span>
        <div className="flex items-center gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-xs ${NS_STYLE[status]}`}>
            {NS_LABEL[status]}
          </span>
          {!locked && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              disabled={pending}
              className="rounded-lg bg-surface px-2.5 py-1 text-xs text-neutral-300 disabled:opacity-50"
            >
              {attending ? "빠져요" : "변경"}
            </button>
          )}
        </div>
      </div>

      {reason && !open && <p className="mt-1.5 text-xs text-neutral-500">{reason}</p>}

      {locked && (
        <p className="mt-1.5 text-xs text-neutral-500">
          관리자가 처리한 기록이에요. 수정이 필요하면 관리자에게 말해주세요.
        </p>
      )}

      {open && !locked && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="grid grid-cols-4 gap-1.5">
            {REASON_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPick(t)}
                className={`h-9 rounded-lg border text-xs font-medium ${
                  pick === t ? NS_STYLE[t] : "border-line bg-surface text-neutral-400"
                }`}
              >
                {NS_LABEL[t]}
              </button>
            ))}
          </div>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={REASON_PLACEHOLDER[pick]}
            className="mt-2.5"
          />

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit(pick, text)}
              className="h-10 flex-1 rounded-xl bg-white text-sm font-medium text-neutral-900 disabled:opacity-50"
            >
              {pending ? "등록 중…" : "등록"}
            </button>
            {!attending && (
              <button
                type="button"
                disabled={pending}
                onClick={() => submit("present", "")}
                className="h-10 shrink-0 rounded-xl bg-surface px-4 text-sm text-neutral-300 disabled:opacity-50"
              >
                참석으로
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}