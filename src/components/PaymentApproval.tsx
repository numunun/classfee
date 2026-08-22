"use client";

import { useState, useTransition } from "react";
import { decidePayment } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";

export function ApprovalButtons({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="거절 사유"
          className="!py-1.5 text-sm"
        />
        <button
          disabled={pending}
          onClick={() => 
            start(async () => {
              try {
                await decidePayment(requestId, "rejected", reason);
                toast("입금 신청을 거절했어요.");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            })
          }
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium"
        >
          확인
        </button>
        <button onClick={() => setRejecting(false)} className="px-2 text-sm text-neutral-400">
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setRejecting(true)}
        className="rounded-lg border border-red-900/60 px-3 py-1.5 text-sm text-red-400"
      >
        거절
      </button>
      <button
        disabled={pending}
        onClick={() => 
          start(async () => {
            try {
              await decidePayment(requestId, "approved");
              toast("입금을 승인했어요. 완납 처리됐어요.");
            } catch (e) {
              toast((e as Error).message, "error");
            }
          })
        }
        className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "처리 중…" : "승인"}
      </button>
    </div>
  );
}
