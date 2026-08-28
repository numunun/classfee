import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { AutoRefresh } from "@/components/AutoRefresh";
import { BoardClock } from "@/components/BoardClock";
import { BoardSessionTabs } from "@/components/BoardSessionTabs";
import {
  NS_LABEL,
  NS_ICON,
  SESSIONS,
  liveSessionAt,
  seoulMinutesOfDay,
  type NightStatus,
  type Session,
} from "@/lib/night-study";

export const metadata: Metadata = { title: "CIP 현황판" };

export const dynamic = "force-dynamic";

type Snap = {
  seat_no: number;
  name: string;
  status: NightStatus;
  reason: string | null;
  is_independent: boolean;
};

const COLS = 7;

// 잘림의 원인은 세로였으므로 크기 기준을 vh 로 잡는다.
// 화면이 세로로 짧아지면 글자도 같이 작아져서 항상 한 화면에 들어간다.
const T = {
  title: "text-[clamp(1.1rem,3.6vh,3.2rem)]",
  date: "text-[clamp(0.7rem,1.8vh,1.5rem)]",
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

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { grade: string; classNo: string };
  searchParams: { k?: string; s?: string };
}) {
  const grade = Number(params.grade);
  const classNo = Number(params.classNo);

  const explicit = (SESSIONS as readonly number[]).includes(Number(searchParams.s))
    ? (Number(searchParams.s) as Session)
    : null;
  const session: Session = explicit ?? liveSessionAt(seoulMinutesOfDay()) ?? 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const [{ data, error }, { data: meta }] = await Promise.all([
    supabase.rpc("board_snapshot", {
      p_grade: grade,
      p_class: classNo,
      p_session: session,
      p_code: searchParams.k ?? "",
    }),
    supabase.rpc("board_meta"),
  ]);

  if (error) {
    return (
      <div className="grid h-[100dvh] place-items-center px-8 text-center">
        <div>
          <p className="text-2xl font-semibold text-red-300">현황판을 열 수 없어요</p>
          <p className="mt-3 text-neutral-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const rows = (data ?? []) as Snap[];
  const bySeat = new Map(rows.map((r) => [r.seat_no, r]));
  const maxSeat = Math.max(35, ...rows.map((r) => r.seat_no));
  const rowCount = Math.ceil(maxSeat / COLS);

  const counts = ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: rows.filter((r) => r.status === k).length }),
    {} as Record<NightStatus, number>
  );

  const label = (Array.isArray(meta) && meta[0]?.class_label) || `${grade}학년 ${classNo}반`;
  const qs = searchParams.k ? `&k=${encodeURIComponent(searchParams.k)}` : "";

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden px-[1.5vw] py-[1.2vh]">
      <AutoRefresh seconds={15} />

      <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h1 className={`${T.title} font-bold leading-tight tracking-tight`}>
            {label} CIP 현황
          </h1>
          <p className={`${T.date} text-neutral-500`}>
            <BoardClock />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BoardSessionTabs current={session} query={qs} className={T.chip} />
          <span className="mx-1 h-5 w-px bg-line" />
          {ORDER.filter((k) => counts[k] > 0).map((k) => (
            <span
              key={k}
              className={`${T.chip} rounded-lg border px-[0.8em] py-[0.25em] font-semibold ${CARD[k]}`}
            >
              {NS_LABEL[k]} {counts[k]}
            </span>
          ))}
        </div>
      </header>

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
              className={`flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border px-1 text-center ${CARD[r.status]}`}
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
    </div>
  );
}