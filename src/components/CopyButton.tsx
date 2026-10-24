"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/Toast";

/** 계좌번호 등 글자를 복사하는 작은 버튼 */
export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      toast("복사했어요.");
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast("복사하지 못했어요. 길게 눌러 직접 복사해 주세요.", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="btn btn-sm press shrink-0 bg-surface-2 font-medium text-neutral-200"
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {/* 좁은 화면에서는 아이콘만 보여 계좌번호 자리를 남긴다 */}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  );
}
