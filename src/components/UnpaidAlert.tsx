import { won } from "@/lib/types";
import { todayISO } from "@/lib/night-study";

/**
 * 미납 벌금이 있을 때만 상단에 뜨는 알림. 없으면 아무것도 그리지 않는다.
 * 색은 유틸리티 클래스로 지정한다 — 밝은 테마에서는 오버라이드가
 * 진한 빨강으로 바꿔주므로 어느 테마에서도 읽힌다.
 */
export function UnpaidAlert({
  count,
  total,
  nextDue,
  doubleEnabled,
}: {
  count: number;
  total: number;
  nextDue?: string;
  doubleEnabled: boolean;
}) {
  if (count === 0) return null;

  let label: string | null = null;
  let daysLeft: number | null = null;

  if (nextDue) {
    const due = new Date(nextDue + "T00:00:00+09:00");
    label = `${due.getMonth() + 1}월 ${due.getDate()}일`;
    const now = new Date(todayISO() + "T00:00:00+09:00");
    daysLeft = Math.round((due.getTime() - now.getTime()) / 86400000);
  }

  const urgent = daysLeft !== null && daysLeft <= 2;

  return (
    <section
      className={`rounded-2xl border px-5 py-4 ${
        urgent ? "border-red-800/60 bg-red-950/40" : "border-red-900/60 bg-red-950/40"
      }`}
    >
      <p className="text-base font-bold text-red-300">
        💸 내야 할 벌금이 {count}건 있어요
      </p>
      <p className="mt-1 text-2xl font-extrabold text-red-400">{won(total)}</p>

      {label && (
        <p className="mt-2 text-sm text-red-400/80">
          {daysLeft !== null && daysLeft < 0
            ? "납부 기한이 지났어요."
            : daysLeft === 0
            ? "오늘까지 내야 해요."
            : `${label}까지 ${daysLeft}일 남았어요.`}
          {doubleEnabled && daysLeft !== null && daysLeft >= 0 && " 넘기면 2배가 돼요."}
        </p>
      )}
    </section>
  );
}