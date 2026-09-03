import { won, payable, type Fine } from "@/lib/types";
import { todayISO } from "@/lib/night-study";

/**
 * 미납 벌금 요약.
 * 날짜는 일부러 쓰지 않는다 — 벌금마다 기한이 달라서, 요약에 특정 날짜를 적으면
 * 바로 아래 부과 내역의 날짜와 어긋나 보인다. 자세한 건 목록에서 확인하게 한다.
 */
export function UnpaidAlert({ fines, doubleEnabled }: { fines: Fine[]; doubleEnabled: boolean }) {
  if (fines.length === 0) return null;

  const total = fines.reduce((a, f) => a + payable(f), 0);
  const today = new Date(todayISO() + "T00:00:00+09:00").getTime();

  const daysLeft = fines.map((f) =>
    Math.round((new Date(f.due_date + "T00:00:00+09:00").getTime() - today) / 86400000)
  );

  const soonest = Math.min(...daysLeft);
  const overdue = daysLeft.filter((d) => d < 0).length;

  let line: string;
  if (overdue > 0) {
    line = `기한이 지난 벌금이 ${overdue}건 있어요.`;
  } else if (soonest === 0) {
    line = "오늘이 기한인 벌금이 있어요.";
  } else {
    line = `가장 빠른 기한이 ${soonest}일 남았어요.`;
  }

  return (
    <section className="rounded-2xl border border-red-900/50 bg-red-950/25 px-5 py-4">
      <p className="text-sm font-semibold text-red-300">
        아직 내지 않은 벌금이 {fines.length}건 있어요
      </p>
      <p className="mt-1 text-2xl font-bold text-red-400">{won(total)}</p>
      <p className="mt-1.5 text-xs text-neutral-400">
        {line}
        {doubleEnabled && " 건별로 기한이 다르니 아래에서 확인하세요."}
      </p>
    </section>
  );
}