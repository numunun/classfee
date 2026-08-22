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

// 4K(3840px)에서 꽉 차도록 vw 기준으로 키운다. 작은 화면에서도 clamp 로 안전.
const T = {
  title: "text-[clamp(1.75rem,2.6vw,4.5rem)]",
  date: "text-[clamp(0.95rem,1.2vw,2rem)]",
  chip: "text-[clamp(0.8rem,1.05vw,1.9rem)]",
  seat: "text-[clamp(0.7rem,0.85vw,1.5rem)]",
  name: "text-[clamp(1.05rem,1.7vw,3rem)]",
  badge: "text-[clamp(0.75rem,1vw,1.75rem)]",
  reason: "text-[clamp(0.65rem,0.8vw,1.4rem)]",
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

  // ?s= 가 있으면 그것을 쓰고, 없으면 한국 시각 기준 "지금 진행 중인 차수"를 기본값으로.
  // 어느 차수 시간도 아니면 1차를 보여준다.
  const explicit = (SESSIONS as readonly number[]).includes(Number(searchParams.s))
    ? (Number(searchParams.s) as Session)
    : null;
  const session: Session = explicit ?? liveSessionAt(seoulMinutesOfDay()) ?? 1;

  // 로그인 없이 도는 화면이므로 쿠키 없는 익명 클라이언트를 쓴다.
  // board_snapshot 은 security definer 라 이름/번호/상태만 내보낸다.
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
      <div className="grid min-h-dvh place-items-center px-8 text-center">
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

  const counts = ORDER.reduce(
    (acc, k) => ({ ...acc, [k]: rows.filter((r) => r.status === k).length }),
    {} as Record<NightStatus, number>
  );

  const label = (Array.isArray(meta) && meta[0]?.class_label) || `${grade}학년 ${classNo}반`;
  const qs = searchParams.k ? `&k=${encodeURIComponent(searchParams.k)}` : "";

  return (
    <div className="min-h-dvh px-[2vw] py-[1.6vw]">
      <AutoRefresh seconds={60} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`${T.title} font-bold tracking-tight`}>{label} CIP 현황</h1>
          <p className={`${T.date} mt-1 text-neutral-500`}>
            <BoardClock />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BoardSessionTabs current={session} query={qs} className={T.chip} />
          <span className="mx-1 h-6 w-px bg-line" />
          {ORDER.filter((k) => counts[k] > 0).map((k) => (
            <span
              key={k}
              className={`${T.chip} rounded-xl border px-[0.9em] py-[0.35em] font-semibold ${CARD[k]}`}
            >
              {NS_LABEL[k]} {counts[k]}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-[1.4vw] grid grid-cols-5 gap-[0.8vw] sm:grid-cols-7">
        {Array.from({ length: maxSeat }, (_, i) => i + 1).map((n) => {
          const r = bySeat.get(n);
          if (!r) {
            return (
              <div
                key={n}
                className="rounded-[1vw] border border-dashed border-line px-2 py-[1.2vw] text-center opacity-25"
              >
                <p className={`${T.seat} text-neutral-600`}>{n}번</p>
              </div>
            );
          }
          return (
            <div
              key={n}
              className={`flex flex-col items-center rounded-[1vw] border px-[0.5vw] py-[1.1vw] text-center ${CARD[r.status]}`}
            >
              <p className={`${T.seat} font-medium opacity-50`}>{n}번</p>
              <p className={`${T.name} mt-[0.3vw] font-bold leading-tight text-white`}>{r.name}</p>
              <span
                className={`${T.badge} mt-[0.5vw] inline-block rounded-full border border-current px-[0.7em] py-[0.15em] font-semibold`}
              >
                {NS_ICON[r.status]} {NS_LABEL[r.status]}
              </span>
              {r.reason && (
                <p className={`${T.reason} mt-[0.35vw] line-clamp-2 opacity-60`}>{r.reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}