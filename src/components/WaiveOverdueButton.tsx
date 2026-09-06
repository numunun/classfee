"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { waiveOverdue } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";

/** 연체로 2배가 된 벌금을 원금으로 되돌린다 (입금 누락 구제용) */
export function WaiveOverdueButton({ fineId }: { fineId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="연체 2배를 원금으로 되돌립니다"
        className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-neutral-400"
      >
        되돌리기
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div
            className="mx-auto w-full max-w-sm rounded-2xl p-5"
            style={{
              background: "rgb(var(--c-surface))",
              border: "1px solid rgb(var(--c-line))",
              boxShadow: "0 24px 70px rgba(0,0,0,.45)",
            }}
          >
            <h3 className="font-semibold">연체 배수 되돌리기</h3>
            <p className="mt-1 text-sm text-neutral-400">
              2배로 오른 금액을 원금으로 되돌리고, 앞으로도 이 건은 다시 오르지 않아요.
              이미 입금했는데 신청을 놓쳤거나 서비스 장애로 누락된 경우에 쓰세요.
            </p>
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="사유 (예: 기한 내 입금 확인됨)"
              className="mt-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-neutral-400"
              >
                닫기
              </button>
              <button
                disabled={pending || !reason.trim()}
                onClick={() =>
                  start(async () => {
                    const res = await waiveOverdue(fineId, reason);
                    if (res.ok) {
                      toast("원금으로 되돌렸어요.");
                      setOpen(false);
                      router.refresh();
                    } else {
                      toast(res.message, "error");
                    }
                  })
                }
                className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
              >
                되돌리기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}