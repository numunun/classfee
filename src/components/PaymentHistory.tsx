"use client";

import { useState } from "react";
import { won } from "@/lib/types";

export type HistoryRow = {
  id: string;
  total_amount: number;
  depositor_name: string;
  status: "approved" | "rejected";
  reviewed_at: string | null;
  reject_reason: string | null;
  studentName: string;
  reviewerName: string;
  itemCount: number;
};

function dt(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function PaymentHistory({ rows }: { rows: HistoryRow[] }) {
  const [filter, setFilter] = useState<"all" | "approved" | "rejected">("all");
  const [query, setQuery] = useState("");

  const q = query.trim();
  const shown = rows
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => !q || r.studentName.includes(q) || r.depositor_name.includes(q));

  const approvedTotal = rows
    .filter((r) => r.status === "approved")
    .reduce((a, r) => a + r.total_amount, 0);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(
            [
              ["all", "전체"],
              ["approved", "승인"],
              ["rejected", "거절"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`h-9 rounded-lg px-3 text-xs font-medium ${
                filter === k ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-500">
          승인 합계 {won(approvedTotal)}
        </span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 입금자명으로 찾기"
        className="mb-3"
      />

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {shown.map((r) => {
          const ok = r.status === "approved";
          return (
            <li key={r.id} className="border-b border-line px-4 py-3 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    {r.studentName}
                    <span className="ml-2 text-xs text-neutral-500">
                      {r.itemCount}건 · {won(r.total_amount)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    입금자 {r.depositor_name} · {dt(r.reviewed_at)}
                    {r.reviewerName ? ` · ${r.reviewerName} 처리` : ""}
                  </p>
                  {!ok && r.reject_reason && (
                    <p className="mt-0.5 text-xs text-red-400/80">사유: {r.reject_reason}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-xs ${
                    ok
                      ? "border-green-800/70 bg-green-950 text-green-300"
                      : "border-red-800/70 bg-red-950 text-red-300"
                  }`}
                >
                  {ok ? "승인" : "거절"}
                </span>
              </div>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-neutral-500">
            해당하는 처리 내역이 없어요.
          </li>
        )}
      </ul>
    </>
  );
}