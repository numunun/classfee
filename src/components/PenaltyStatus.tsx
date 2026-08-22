import { won } from "@/lib/types";
import { nextPenalty, currentPenalty, dateCount } from "@/lib/penalty";

/** 누적 벌금에 따른 조치 안내 (규정 별표 3 ⑤) */
export function PenaltyStatus({ total }: { total: number }) {
  const next = nextPenalty(total);
  const current = currentPenalty(total);
  const remaining = next.amount - total;
  const soon = remaining <= 3000;
  const times = dateCount(total);

  if (!current && !soon) return null;

  return (
    <div
      className={
        current
          ? "rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3"
          : "rounded-xl border border-amber-600/50 bg-amber-950/40 px-4 py-3"
      }
    >
      {current ? (
        <p className="text-sm font-medium text-red-300">
          현재 「{current.label}」 대상이에요
          {times ? ` · ${times}회차` : ""}
        </p>
      ) : (
        <p className="text-sm font-medium text-amber-300">
          「{next.label}」 문턱까지 {won(remaining)} 남았어요
        </p>
      )}

      <p className="mt-0.5 text-xs text-neutral-400">
        누적 {won(total)} · 다음 조치는 {won(next.amount)}에서 「{next.label}」
      </p>
    </div>
  );
}