import { TriangleAlert } from "lucide-react";
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
      className={`flex gap-2.5 rounded-xl px-3.5 py-3 ${
        current ? "bg-red-500/10" : "bg-amber-500/10"
      }`}
    >
      <TriangleAlert
        className={`mt-0.5 size-4 shrink-0 ${current ? "text-red-400" : "text-amber-400"}`}
        aria-hidden
      />
      <div className="min-w-0">
        {current ? (
          <p className="text-sm font-semibold text-red-400">
            현재 「{current.label}」 대상이에요
            {times ? ` · ${times}회차` : ""}
          </p>
        ) : (
          <p className="text-sm font-semibold text-amber-400">
            「{next.label}」 문턱까지 {won(remaining)} 남았어요
          </p>
        )}
        <p className="mt-0.5 text-xs text-neutral-500">
          누적 {won(total)} · 다음 조치는 {won(next.amount)}에서 「{next.label}」
        </p>
      </div>
    </div>
  );
}
