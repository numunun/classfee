"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
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

  const total = useMemo(
    () => fines.filter((f) => picked.has(f.id)).reduce((a, f) => a + payable(f), 0),
    [fines, picked]
  );

  function toggle(id: string) {
    setPicked((cur) => {
      const n = new Set(cur);
      n.has(id) ? n.delete(id) : n.add(id);
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

      toast("입금 완료 신청을 보냈어요. 반장이 통장 확인 후 승인합니다.");
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-medium text-neutral-900"
      >
        ✓ 입금 완료 신청
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 sm:max-w-md sm:rounded-2xl">
            <h3 className="font-semibold">입금 완료 신청</h3>
            <p className="mt-1 text-xs text-neutral-500">
              납부한 항목을 골라 한 번에 신청하세요. 입금자명은 반드시 본인 실명으로.
            </p>

            <ul className="mt-4 space-y-2">
              {fines.map((f) => (
                <li key={f.id}>
                  <label className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                    <input
                      type="checkbox"
                      checked={picked.has(f.id)}
                      onChange={() => toggle(f.id)}
                      className="!w-auto"
                    />
                    <span className="flex-1 text-sm">
                      {FINE_TYPE_LABEL[f.type]}
                      {f.reason ? <span className="text-neutral-500"> · {f.reason}</span> : null}
                    </span>
                    <span className="text-sm font-medium">{won(payable(f))}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
              <span className="text-sm text-neutral-400">합계</span>
              <span className="text-lg font-semibold">{won(total)}</span>
            </div>

            <div className="mt-4">
              <label>입금자명 (본인 실명)</label>
              <input value={depositor} onChange={(e) => setDepositor(e.target.value)} className="mt-1.5" />
            </div>
            <div className="mt-3">
              <label>입금 완료 화면 사진</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-surface-2 py-3 text-sm text-neutral-300">
                취소
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-medium text-neutral-900 disabled:opacity-50"
              >
                {busy ? "보내는 중…" : "신청하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
