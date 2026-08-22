"use client";
import { useState, useTransition } from "react";
import { softDeleteFine } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";

export function DeleteFineButton({ fineId }: { fineId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="벌금 삭제"
        className="text-neutral-500 hover:text-red-400"
      >
        🗑
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5">
            <h3 className="font-semibold">벌금 삭제</h3>
            <p className="mt-1 text-sm text-neutral-400">
              기록은 남고 &quot;삭제됨&quot;으로 표시돼요. 삭제 사유를 적어주세요.
            </p>
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 잘못 부과함"
              className="mt-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-neutral-400">
                취소
              </button>
              <button
                disabled={pending || !reason.trim()}
                onClick={() =>
                  start(async () => {
                    try {
                      await softDeleteFine(fineId, reason.trim());
                      setOpen(false);
                      toast("벌금을 삭제했어요.");
                    } catch (e) {
                      toast((e as Error).message, "error");
                    }
                  })
                }
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
