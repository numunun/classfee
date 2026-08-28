"use client";

import { useState, useTransition } from "react";
import { softDeleteFine } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";

export function CancelFineButton({ fineId }: { fineId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="벌금 취소"
        className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-neutral-400 hover:text-red-300"
      >
        취소
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5">
            <h3 className="font-semibold">벌금 취소</h3>
            <p className="mt-1 text-sm text-neutral-400">
              기록은 남고 「취소됨」으로 표시돼요. 학생 화면에도 취소 사실이 보여요.
            </p>
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="취소 사유 (예: 잘못 부과함)"
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
                    try {
                      await softDeleteFine(fineId, reason.trim());
                      setOpen(false);
                      toast("벌금을 취소했어요.");
                    } catch (e) {
                      toast((e as Error).message, "error");
                    }
                  })
                }
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                취소 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}