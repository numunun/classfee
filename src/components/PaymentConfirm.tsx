"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadReceipt } from "@/lib/receipt-upload";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import { FINE_TYPE_LABEL, payable, shortDate, won, type Fine } from "@/lib/types";

export type UnpaidStudent = {
  id: string;
  name: string;
  studentNumber: number | null;
  fines: Fine[]; // 미납·2배 건만
};

/**
 * 미납 학생 한 줄 + 입금 확인 창.
 * 관리자가 받은 벌금을 고르고, 통장 입금 내역 스크린샷을 붙여 확인하면 바로 완납 처리된다.
 * (검증·완납 처리는 DB 의 confirm_payment 가 한다)
 */
export function PaymentConfirmRow({
  student,
  autoOpen = false,
}: {
  student: UnpaidStudent;
  /** 학생 상세에서 넘어온 경우 창을 바로 연다 */
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(autoOpen);
  const [picked, setPicked] = useState<Set<string>>(new Set(student.fines.map((f) => f.id)));
  const [depositor, setDepositor] = useState(student.name);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const owing = student.fines.reduce((a, f) => a + payable(f), 0);
  const total = useMemo(
    () => student.fines.filter((f) => picked.has(f.id)).reduce((a, f) => a + payable(f), 0),
    [student.fines, picked]
  );

  function toggle(id: string) {
    setPicked((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function confirm() {
    if (picked.size === 0) return toast("받은 벌금을 고르세요.", "error");
    if (!file) return toast("입금 내역 스크린샷을 첨부하세요.", "error");

    setBusy(true);
    try {
      const supabase = createClient();
      const path = await uploadReceipt(supabase, file);
      const { error } = await supabase.rpc("confirm_payment", {
        p_student: student.id,
        p_fine_ids: Array.from(picked),
        p_receipt: path,
        p_depositor: depositor.trim(),
      });
      if (error) throw new Error(error.message);

      toast(`${student.name} · ${won(total)} 입금을 확인했어요.`);
      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <li className="flex items-center gap-3 border-t border-line px-4 py-3.5 first:border-t-0">
        <Avatar name={student.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold">
            {student.name}
            {student.studentNumber != null && (
              <span className="ml-1.5 text-xs font-normal text-neutral-500">
                {student.studentNumber % 100}번
              </span>
            )}
          </p>
          <p className="truncate text-xs text-neutral-500">
            미납 {student.fines.length}건 · <span className="font-semibold text-red-400">{won(owing)}</span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="btn btn-sm press shrink-0 bg-surface-2 font-semibold text-neutral-200"
        >
          입금 확인
        </button>
      </li>

      {open && (
        <Modal onClose={() => !busy && setOpen(false)} align="bottom">
          <div
            className="mx-auto flex max-h-[88vh] w-full flex-col overflow-hidden rounded-3xl sm:w-[28rem]"
            style={{
              background: "rgb(var(--c-surface))",
              border: "1px solid rgb(var(--c-line))",
              boxShadow: "0 24px 70px rgba(0,0,0,.5)",
            }}
          >
            <div className="shrink-0 px-5 pb-4 pt-5" style={{ borderBottom: "1px solid rgb(var(--c-line))" }}>
              <h3 className="text-lg font-bold">{student.name} 입금 확인</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                통장에 들어온 금액과 맞는 벌금을 고르고, 입금 내역 스크린샷을 붙여 주세요. 확인하면 바로
                완납 처리돼요.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <p className="mb-2 text-xs font-medium text-neutral-400">받은 벌금</p>
              <ul className="space-y-2">
                {student.fines.map((f) => {
                  const on = picked.has(f.id);
                  return (
                    <li key={f.id}>
                      <label
                        className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition"
                        style={{
                          background: on ? "rgb(var(--c-accent) / 0.12)" : "rgb(var(--c-surface-2))",
                          border: `1px solid ${on ? "rgb(var(--c-accent) / 0.55)" : "rgb(var(--c-line))"}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(f.id)}
                          className="size-4 !w-auto shrink-0"
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="font-medium">{FINE_TYPE_LABEL[f.type]}</span>
                          <span className="block truncate text-xs text-neutral-500">
                            {shortDate(f.occurred_date)} 부과
                            {f.reason && f.reason !== FINE_TYPE_LABEL[f.type] ? ` · ${f.reason}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{won(payable(f))}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div
                className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgb(var(--c-surface-2))", border: "1px solid rgb(var(--c-line))" }}
              >
                <span className="text-sm text-neutral-400">합계 {picked.size}건</span>
                <span className="text-xl font-extrabold tabular-nums">{won(total)}</span>
              </div>

              <div className="mt-4">
                <label htmlFor={`depositor-${student.id}`}>통장에 찍힌 입금자명</label>
                <input
                  id={`depositor-${student.id}`}
                  value={depositor}
                  onChange={(e) => setDepositor(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="mt-3">
                <label>입금 내역 스크린샷 (필수)</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1.5 flex h-[2.875rem] w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm"
                  style={{
                    background: "rgb(var(--c-surface-2))",
                    border: `1px dashed ${file ? "rgb(var(--c-accent) / 0.7)" : "rgb(var(--c-line))"}`,
                  }}
                >
                  {file ? (
                    <ImageIcon className="size-4 shrink-0 text-accent" aria-hidden />
                  ) : (
                    <ImagePlus className="size-4 shrink-0 text-neutral-500" aria-hidden />
                  )}
                  <span className={`truncate ${file ? "" : "text-neutral-500"}`}>
                    {file ? file.name : "통장 앱 입금 내역 캡처 선택"}
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </div>
            </div>

            <div className="shrink-0 px-5 pb-5 pt-4" style={{ borderTop: "1px solid rgb(var(--c-line))" }}>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="h-12 flex-1 rounded-xl text-sm text-neutral-400"
                  style={{ background: "rgb(var(--c-surface-2))" }}
                >
                  취소
                </button>
                <button
                  onClick={confirm}
                  disabled={busy || picked.size === 0 || !file}
                  className="btn btn-primary press h-12 flex-[2] rounded-xl text-sm"
                >
                  {busy ? "처리 중…" : `${won(total)} 입금 확인`}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
