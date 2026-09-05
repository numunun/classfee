"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { CancelFineButton } from "@/components/CancelFineButton";
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
    <section className="rounded-2xl bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-medium text-neutral-300">최근 벌금 내역</h2>
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

      <ul className="overflow-hidden rounded-b-2xl">
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
              className={`relative flex items-center gap-3 border-t border-line py-3 pl-4 pr-4 first:border-t-0 ${
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
                <p className="flex items-center gap-2">
                  <span className={`truncate font-semibold ${done ? "line-through" : ""}`}>
                    {f.students?.name}
                  </span>
                  <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-neutral-400">
                    {label}
                    {f.type === "cleaning" && " 자동"}
                  </span>
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {shortDate(f.created_at)}
                  {note ? ` · ${note}` : ""}
                  {cancelled && f.delete_reason ? ` · ${f.delete_reason}` : ""}
                </p>
              </div>

              <span className="w-14 shrink-0 text-center">
                {cancelled ? (
                  <span className="text-xs text-neutral-500">취소됨</span>
                ) : (
                  <StatusBadge status={f.status} />
                )}
              </span>

              <span
                className={`w-[4.5rem] shrink-0 text-right font-semibold tabular-nums ${
                  done ? "line-through" : ""
                }`}
              >
                {won(payable(f))}
              </span>

              <span className="w-11 shrink-0 text-right">
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