"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decidePayment } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";

export function ApprovalButtons({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const toast = useToast();
  const router = useRouter();

  function run(decision: "approved" | "rejected", why?: string) {
    start(async () => {
      const res = await decidePayment(requestId, decision, why);
      if (res.ok) {
        toast(decision === "approved" ? "입금을 승인했어요. 완납 처리됐어요." : "입금 신청을 거절했어요.");
        setRejecting(false);
        router.refresh();
      } else {
        toast(res.message, "error");
      }
    });
  }

  if (rejecting) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="거절 사유"
          className="sm:w-48"
        />
        <div className="flex gap-2">
          <button
            disabled={pending || !reason.trim()}
            onClick={() => run("rejected", reason)}
            className="h-[2.875rem] flex-1 rounded-xl px-4 text-sm font-medium disabled:opacity-50 sm:flex-none"
            style={{ background: "#DC2626", color: "#fff" }}
          >
            {pending ? "처리 중…" : "거절 확인"}
          </button>
          <button
            onClick={() => setRejecting(false)}
            className="h-[2.875rem] rounded-xl bg-surface-2 px-4 text-sm text-neutral-400"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        disabled={pending}
        onClick={() => setRejecting(true)}
        className="h-10 rounded-xl border border-red-900/60 px-4 text-sm text-red-400 disabled:opacity-50"
      >
        거절
      </button>
      <button
        disabled={pending}
        onClick={() => run("approved")}
        className="h-10 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
        style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
      >
        {pending ? "처리 중…" : "승인"}
      </button>
    </div>
  );
}