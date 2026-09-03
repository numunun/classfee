import { won, payable, type Fine } from "@/lib/types";
import { todayISO } from "@/lib/night-study";

/**
 * 미납 벌금 알림.
 * 벌금마다 기한이 다르므로 "가장 급한 한 건"을 기준으로 안내한다.
 * (합계 금액과 기한을 섞어 말하면 그 금액 전체가 그날 2배 되는 것처럼 읽힌다)
 */
export function UnpaidAlert({ fines, doubleEnabled }: { fines: Fine[]; doubleEnabled: boolean }) {
  if (fines.length === 0) return null;

  const total = fines.reduce((a, f) => a + payable(f), 0);
  const today = new Date(todayISO() + "T00:00:00+09:00").getTime();

  const withDays = fines
    .map((f) => ({
      fine: f,
      days: Math.round(
        (new Date(f.due_date + "T00:00:00+09:00").getTime() - today) / 86400000
      ),
    }))
    .sort((a, b) => a.days - b.days);

  const soonest = withDays[0];
  const overdue = withDays.filter((x) => x.days < 0).length;
  const d = soonest.days;
  const due = new Date(soonest.fine.due_date + "T00:00:00+09:00");
  const label = `${due.getMonth() + 1}월 ${due.getDate()}일`;
  const amount = won(payable(soonest.fine));

  let line: string;
  if (overdue > 0) {
    line = `기한이 지난 벌금이 ${overdue}건 있어요.`;
  } else if (d === 0) {
    line = `오늘이 기한인 벌금이 있어요. ${amount}`;
  } else {
    line = `가장 빠른 기한은 ${label} (${d}일 뒤) · ${amount}`;
  }

  return (
    <section className="rounded-2xl border border-red-900/50 bg-red-950/25 px-5 py-4">
      <p className="text-sm font-semibold text-red-300">
        아직 내지 않은 벌금이 {fines.length}건 있어요
      </p>
      <p className="mt-1 text-2xl font-bold text-red-400">{won(total)}</p>
      <p className="mt-1.5 text-xs text-neutral-400">
        {line}
        {doubleEnabled && " 기한을 넘기면 그 건만 2배가 돼요."}
      </p>
    </section>
  );
}