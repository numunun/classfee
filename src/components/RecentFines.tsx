"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelFineButton } from "@/components/CancelFineButton";
import { WaiveOverdueButton } from "@/components/WaiveOverdueButton";
import {
  FINE_TYPE_LABEL,
  payable,
  won,
  shortDate,
  type Fine,
  type FineType,
} from "@/lib/types";

export type FineRow = Fine & { students: { name: string } | null };

/**
 * 상태별 색.
 * 밝은 테마(주황 계열)에서도 구분되도록 인라인 hex 로 고정한다.
 * Tailwind 색 클래스를 쓰면 테마의 색 반전 규칙에 걸리거나 배경에 묻힌다.
 */
const EDGE: Record<string, string> = {
  unpaid: "#DC2626",
  doubled: "#7F1D1D",
  pending_approval: "#B45309",
  paid: "#15803D",
};

export function RecentFines({ rows }: { rows: FineRow[] }) {
  const [showCancelled, setShowCancelled] = useState(false);

  const cancelledCount = rows.filter((f) => f.deleted_at).length;
  const shown = (showCancelled ? rows : rows.filter((f) => !f.deleted_at)).slice(0, 30);

  return (
    <section className="rounded-3xl bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <h2 className="font-semibold">최근 벌금 내역</h2>
        {cancelledCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="size-3.5 !w-auto"
            />
            취소된 벌금 보기 ({cancelledCount})
          </label>
        )}
      </div>

      <ul className="overflow-hidden rounded-b-3xl">
        {shown.map((f) => {
          const cancelled = !!f.deleted_at;
          // 끝난 건(완납·취소)은 흐리게 물러나고, 처리할 건만 또렷하게 남는다
          const done = cancelled || f.status === "paid";
          const label = FINE_TYPE_LABEL[f.type as FineType];
          // 사유가 종류와 같은 말이면(지각 → "지각") 중복이라 숨긴다
          const note = f.reason && f.reason !== label ? f.reason : null;

          return (
            <li
              key={f.id}
              className={`relative flex items-center gap-2.5 border-t border-line py-3 pl-4 pr-3 first:border-t-0 sm:gap-3 sm:pr-4 ${
                done ? "opacity-45" : ""
              }`}
            >
              {/* 상태 표시는 행 높이와 무관한 알약으로 그린다.
                  행 전체에 걸치면 구분선과 부딪히고 길이도 제각각으로 보인다. */}
              {!cancelled && EDGE[f.status] && (
                <span
                  aria-hidden
                  className="absolute left-1.5 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full"
                  style={{ background: EDGE[f.status] }}
                />
              )}

              <Avatar name={f.students?.name ?? "?"} />

              <div className="min-w-0 flex-1">
                <p className={`truncate text-[0.9375rem] font-semibold ${done ? "line-through" : ""}`}>
                  {f.students?.name}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  <span className="font-medium text-neutral-400">
                    {label}
                    {f.type === "cleaning" && " (자동)"}
                  </span>
                  {" · "}
                  {shortDate(f.created_at)}
                  {note ? ` · ${note}` : ""}
                  {cancelled && f.delete_reason ? ` · ${f.delete_reason}` : ""}
                </p>
              </div>

              {/* 모바일에서는 상태와 금액을 위아래로 쌓는다.
                  가로로 늘어놓으면 고정 폭 칸들에 밀려 이름이 사라지고 버튼이 화면 밖으로 나간다. */}
              <div className="flex shrink-0 flex-col-reverse items-end gap-1 sm:flex-row sm:items-center sm:gap-0">
                <span className="sm:w-[4.5rem] sm:text-center">
                  {cancelled ? (
                    <span className="text-xs text-neutral-500">취소됨</span>
                  ) : (
                    <StatusBadge status={f.status} />
                  )}
                </span>

                <span
                  className={`text-right font-semibold tabular-nums sm:w-[4.5rem] ${
                    done ? "line-through" : ""
                  }`}
                >
                  {won(payable(f))}
                </span>
              </div>

              <span className="flex shrink-0 justify-end gap-1.5 sm:w-[7.5rem]">
                {/* 완납·승인 대기 건은 면제하면 미납으로 되돌아가므로 버튼을 숨긴다 */}
                {!cancelled &&
                  (f.status === "unpaid" || f.status === "doubled") &&
                  (f.overdue_multiplier ?? 1) > 1 && (
                  <WaiveOverdueButton fineId={f.id} />
                )}
                {!cancelled && <CancelFineButton fineId={f.id} />}
              </span>
            </li>
          );
        })}

        {shown.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-neutral-500">
            아직 부과된 벌금이 없어요. &quot;새 벌금 부과&quot;로 시작하세요.
          </li>
        )}
      </ul>
    </section>
  );
}