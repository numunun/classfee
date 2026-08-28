"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  NS_LABEL,
  NS_ICON,
  SESSIONS,
  SESSION_LABEL,
  SESSION_TIME,
  liveSessionAt,
  type NightStatus,
  type Session,
} from "@/lib/night-study";

export type Snap = {
  seat_no: number;
  name: string;
  status: NightStatus;
  reason: string | null;
  is_independent: boolean;
};

export type Snapshots = Record<number, Snap[]>;

const COLS = 7;
const POLL_SEC = 10;

const T = {
  chip: "text-[clamp(0.65rem,1.7vh,1.4rem)]",
  seat: "text-[clamp(0.6rem,1.4vh,1.15rem)]",
  name: "text-[clamp(0.85rem,2.9vh,2.4rem)]",
  badge: "text-[clamp(0.6rem,1.6vh,1.3rem)]",
  reason: "text-[clamp(0.55rem,1.3vh,1.05rem)]",
};

const CARD: Record<NightStatus, string> = {
  present: "border-green-800/60 bg-green-950/40 text-green-200",
  independent: "border-emerald-700/60 bg-emerald-950/40 text-emerald-200",
  academy: "border-amber-700/60 bg-amber-950/40 text-amber-200",
  hospital: "border-rose-800/60 bg-rose-950/40 text-rose-200",
  special: "border-violet-800/60 bg-violet-950/40 text-violet-200",
  other: "border-neutral-600/60 bg-neutral-800/60 text-neutral-200",
};

const ORDER: NightStatus[] = ["present", "independent", "academy", "hospital", "special", "other"];

export function BoardView({
  snapshots: initialSnapshots,
  initial,
  grade,
  classNo,
  code,
}: {
  snapshots: Snapshots;
  initial: Session;
  grade: number;
  classNo: number;
  code: string;
}) {
  const [snapshots, setSnapshots] = useState<Snapshots>(initialSnapshots);
  const [session, setSession] = useState<Session>(initial);
  const [live, setLive] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const prevLive = useRef<Session | null>(null);
  // 마지막으로 받은 데이터의 지문. 달라졌을 때만 화면을 갈아끼운다.
  const fingerprint = useRef(JSON.stringify(initialSnapshots));

  // ---- 데이터 폴링 ----
  // 페이지를 새로고침하지 않고 값만 가져와, 바뀐 경우에만 갱신한다.
  // (router.refresh() 는 화면 전체를 다시 그려서 깜빡임이 생긴다)
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    let cancelled = false;

    async function poll() {
      try {
        const results = await Promise.all(
          SESSIONS.map((n) =>
            supabase.rpc("board_snapshot", {
              p_grade: grade,
              p_class: classNo,
              p_session: n,
              p_code: code,
            })
          )
        );
        if (cancelled) return;
        if (results.some((r) => r.error)) return;

        const next: Snapshots = {
          1: (results[0].data ?? []) as Snap[],
          2: (results[1].data ?? []) as Snap[],
          3: (results[2].data ?? []) as Snap[],
        };
        const sig = JSON.stringify(next);
        if (sig !== fingerprint.current) {
          fingerprint.current = sig;
          setSnapshots(next);
        }
      } catch {
        // 일시적인 네트워크 오류는 무시하고 다음 주기에 다시 시도한다.
      }
    }

    const id = setInterval(poll, POLL_SEC * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [grade, classNo, code]);

  // ---- 차수 자동 전환 ----
  useEffect(() => {
    const compute = () => {
      const d = new Date();
      setLive(liveSessionAt(d.getHours() * 60 + d.getMinutes()));
      setReady(true);
    };
    compute();
    const id = setInterval(compute, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (prevLive.current === live) return;
    prevLive.current = live;
    if (live !== null) setSession(live);
  }, [ready, live]);

  const rows = snapshots[session] ?? [];
  const bySeat = new Map(rows.map((r) => [r.seat_no, r]));
  const maxSeat = Math.max(35, ...rows.map((r) => r.seat_no));
  const rowCount = Math.ceil(maxSeat / COLS);

  const counts = ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: rows.filter((r) => r.status === k).length }),
    {} as Record<NightStatus, number>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {SESSIONS.map((n) => {
          const selected = session === n;
          const isLive = ready && live === n;
          let tone = "border-line bg-surface-2 text-neutral-400";
          if (selected) tone = "border-white bg-white text-neutral-900";
          else if (isLive) tone = "border-green-700 bg-surface-2 text-green-300";
          else if (ready) tone = "border-line bg-surface-2 text-neutral-400 opacity-35";

          return (
            <button
              key={n}
              onClick={() => setSession(n)}
              title={SESSION_TIME[n].label}
              className={`${T.chip} rounded-xl border px-[0.9em] py-[0.35em] font-bold transition ${tone}`}
            >
              <span>{SESSION_LABEL[n]}</span>
              {isLive ? (
                <span className="ml-1.5 inline-block size-2 rounded-full bg-green-400" />
              ) : null}
            </button>
          );
        })}

        <span className="mx-1 h-5 w-px bg-line" />

        {ORDER.filter((k) => counts[k] > 0).map((k) => (
          <span
            key={k}
            className={`${T.chip} rounded-lg border px-[0.8em] py-[0.25em] font-semibold transition-colors ${CARD[k]}`}
          >
            {NS_LABEL[k]} {counts[k]}
          </span>
        ))}
      </div>

      <div
        className="mt-[1.2vh] grid min-h-0 flex-1 gap-[0.7vh]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: rowCount * COLS }, (_, i) => i + 1).map((n) => {
          const r = bySeat.get(n);
          if (!r) {
            return (
              <div
                key={n}
                className="flex items-center justify-center rounded-xl border border-dashed border-line opacity-20"
              >
                <span className={`${T.seat} text-neutral-600`}>{n}번</span>
              </div>
            );
          }
          return (
            <div
              key={n}
              className={`flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border px-1 text-center transition-colors duration-300 ${CARD[r.status]}`}
            >
              <p className={`${T.seat} font-medium leading-none opacity-50`}>{n}번</p>
              <p className={`${T.name} mt-[0.4vh] truncate font-bold leading-tight text-white`}>
                {r.name}
              </p>
              <span
                className={`${T.badge} mt-[0.5vh] rounded-full border border-current px-[0.6em] py-[0.1em] font-semibold leading-tight`}
              >
                {NS_ICON[r.status]} {NS_LABEL[r.status]}
              </span>
              {r.reason && (
                <p className={`${T.reason} mt-[0.3vh] w-full truncate opacity-60`}>{r.reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}