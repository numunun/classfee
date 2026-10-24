import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { type Fine } from "@/lib/types";
import { todayISO } from "@/lib/night-study";

/**
 * 「내야 할 벌금」 카드 안의 한 줄 요약.
 * 날짜는 일부러 쓰지 않는다 — 벌금마다 기한이 달라서, 요약에 특정 날짜를 적으면
 * 바로 아래 부과 내역의 날짜와 어긋나 보인다. 자세한 건 목록에서 확인하게 한다.
 */
export function UnpaidAlert({ fines, pendingCount }: { fines: Fine[]; pendingCount: number }) {
  if (fines.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-neutral-400">
        <CircleCheck className="size-4 text-green-400" aria-hidden />
        {pendingCount > 0
          ? `입금 확인을 기다리는 벌금이 ${pendingCount}건 있어요.`
          : "지금 낼 벌금이 없어요."}
      </p>
    );
  }

  const today = new Date(todayISO() + "T00:00:00+09:00").getTime();
  const daysLeft = fines.map((f) =>
    Math.round((new Date(f.due_date + "T00:00:00+09:00").getTime() - today) / 86400000)
  );
  const soonest = Math.min(...daysLeft);
  const overdue = daysLeft.filter((d) => d < 0).length;

  const urgent = overdue > 0 || soonest <= 1;
  const Icon = urgent ? TriangleAlert : Clock;
  let line: string;
  if (overdue > 0) {
    line = `기한이 지난 벌금이 ${overdue}건 있어요`;
  } else if (soonest === 0) {
    line = "오늘이 기한인 벌금이 있어요";
  } else {
    line = `미납 ${fines.length}건 · 가장 빠른 기한까지 ${soonest}일`;
  }

  return (
    <p
      className={`flex items-center gap-1.5 text-sm font-medium ${
        urgent ? "text-red-400" : "text-neutral-300"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {line}
      {pendingCount > 0 && (
        <span className="font-normal text-neutral-500"> · 확인 대기 {pendingCount}건</span>
      )}
    </p>
  );
}
