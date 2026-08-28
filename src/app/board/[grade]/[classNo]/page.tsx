import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { BoardClock } from "@/components/BoardClock";
import { BoardView, type Snap, type Snapshots } from "@/components/BoardView";
import { SESSIONS, liveSessionAt, seoulMinutesOfDay, type Session } from "@/lib/night-study";

export const metadata: Metadata = { title: "CIP 현황판" };
export const dynamic = "force-dynamic";

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
  const initial: Session = explicit ?? liveSessionAt(seoulMinutesOfDay()) ?? 1;

  // 로그인 없이 도는 화면이므로 쿠키 없는 익명 클라이언트를 쓴다.
  // board_snapshot 은 security definer 라 이름/번호/상태만 내보낸다.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  // 세 차수를 한 번에 받아둔다. 탭을 눌러도 서버를 다시 치지 않아 즉시 전환된다.
  const [s1, s2, s3, metaRes] = await Promise.all([
    ...SESSIONS.map((n) =>
      supabase.rpc("board_snapshot", {
        p_grade: grade,
        p_class: classNo,
        p_session: n,
        p_code: searchParams.k ?? "",
      })
    ),
    supabase.rpc("board_meta"),
  ]);

  const failed = [s1, s2, s3].find((r) => r.error);
  if (failed?.error) {
    return (
      <div className="grid h-[100dvh] place-items-center px-8 text-center">
        <div>
          <p className="text-2xl font-semibold text-red-300">현황판을 열 수 없어요</p>
          <p className="mt-3 text-neutral-400">{failed.error.message}</p>
        </div>
      </div>
    );
  }

  const snapshots: Snapshots = {
    1: (s1.data ?? []) as Snap[],
    2: (s2.data ?? []) as Snap[],
    3: (s3.data ?? []) as Snap[],
  };

  const meta = metaRes.data;
  const label = (Array.isArray(meta) && meta[0]?.class_label) || `${grade}학년 ${classNo}반`;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden px-[1.5vw] py-[1.2vh]">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h1 className="text-[clamp(1.1rem,3.6vh,3.2rem)] font-bold leading-tight tracking-tight">
            {label} CIP 현황
          </h1>
          <p className="text-[clamp(0.7rem,1.8vh,1.5rem)] text-neutral-500">
            <BoardClock />
          </p>
        </div>
      </header>

      <BoardView
        snapshots={snapshots}
        initial={initial}
        grade={grade}
        classNo={classNo}
        code={searchParams.k ?? ""}
      />
    </div>
  );
}