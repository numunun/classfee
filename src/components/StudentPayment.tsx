"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { FINE_TYPE_LABEL, payable, won, type Fine } from "@/lib/types";

export function StudentPayment({
  fines,
  myName,
}: {
  fines: Fine[]; // 신청 가능한 미납/2배 건만 전달됨
  myName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set(fines.map((f) => f.id)));
  const [depositor, setDepositor] = useState(myName);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const total = useMemo(
    () => fines.filter((f) => picked.has(f.id)).reduce((a, f) => a + payable(f), 0),
    [fines, picked]
  );

  function toggle(id: string) {
    setPicked((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (picked.size === 0) return toast("납부할 항목을 선택하세요.", "error");
    if (!depositor.trim()) return toast("입금자명을 입력하세요.", "error");
    if (!file) return toast("입금 완료 화면 사진을 첨부하세요.", "error");

    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 만료됐어요. 새로고침 해주세요.");

      const path = `${user.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("receipts").upload(path, file);
      if (up.error) throw new Error("사진 업로드 실패: " + up.error.message);

      const { error } = await supabase.rpc("create_payment_request", {
        p_fine_ids: Array.from(picked),
        p_depositor: depositor.trim(),
        p_receipt: path,
      });
      if (error) throw new Error(error.message);

      toast("입금 완료 신청을 보냈어요. 관리자가 통장 확인 후 승인해요.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (fines.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold"
        style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
      >
        입금 완료 신청하기
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} align="bottom">
          <div
            className="mx-auto flex max-h-[88vh] w-full flex-col overflow-hidden rounded-3xl sm:max-w-md"
            style={{
              background: "rgb(var(--c-surface))",
              border: "1px solid rgb(var(--c-line))",
              boxShadow: "0 24px 70px rgba(0,0,0,.5)",
            }}
          >
            {/* 헤더 */}
            <div
              className="shrink-0 px-5 pb-4 pt-5"
              style={{ borderBottom: "1px solid rgb(var(--c-line))" }}
            >
              <h3 className="text-lg font-bold">입금 완료 신청</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                계좌로 먼저 입금한 뒤, 납부한 항목을 골라 신청하세요. 관리자가 통장 내역을 확인하고
                승인해요.
              </p>
            </div>

            {/* 본문 (스크롤) */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-2 text-xs font-medium text-neutral-400">납부한 항목</p>
              <ul className="space-y-2">
                {fines.map((f) => {
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
                          {f.reason ? (
                            <span className="block truncate text-xs text-neutral-500">{f.reason}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-sm font-semibold">{won(payable(f))}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div
                className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
                style={{
                  background: "rgb(var(--c-surface-2))",
                  border: "1px solid rgb(var(--c-line))",
                }}
              >
                <span className="text-sm text-neutral-400">합계 {picked.size}건</span>
                <span className="text-xl font-extrabold">{won(total)}</span>
              </div>

              <div className="mt-4">
                <label htmlFor="depositor">입금자명 (본인 실명)</label>
                <input
                  id="depositor"
                  value={depositor}
                  onChange={(e) => setDepositor(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="mt-3">
                <label>입금 완료 화면 사진</label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1.5 flex h-[2.875rem] w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm"
                  style={{
                    background: "rgb(var(--c-surface-2))",
                    border: `1px dashed ${file ? "rgb(var(--c-accent) / 0.7)" : "rgb(var(--c-line))"}`,
                  }}
                >
                  <span className="shrink-0">{file ? "🖼" : "＋"}</span>
                  <span className={`truncate ${file ? "" : "text-neutral-500"}`}>
                    {file ? file.name : "사진 선택하기"}
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

            {/* 하단 버튼 */}
            <div
              className="shrink-0 px-5 pb-5 pt-4"
              style={{ borderTop: "1px solid rgb(var(--c-line))" }}
            >
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="h-12 flex-1 rounded-xl text-sm text-neutral-400"
                  style={{ background: "rgb(var(--c-surface-2))" }}
                >
                  취소
                </button>
                <button
                  onClick={submit}
                  disabled={busy}
                  className="h-12 flex-[2] rounded-xl text-sm font-bold disabled:opacity-50"
                  style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
                >
                  {busy ? "보내는 중…" : `${won(total)} 신청하기`}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}