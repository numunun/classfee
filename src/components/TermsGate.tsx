"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TermsBody } from "@/components/TermsBody";
import { useToast } from "@/components/Toast";
import { TERMS_VERSION } from "@/lib/terms";

/**
 * 약관에 아직 동의하지 않은 사용자에게 화면 전체로 뜨는 동의 창.
 * 이미 가입한 학생도 대상이므로 온보딩이 아니라 별도 관문으로 둔다.
 */
export function TermsGate() {
  const [checked, setChecked] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function agree() {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("agree_terms", { p_version: TERMS_VERSION });
      if (error) {
        toast(error.message, "error");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl"
        style={{
          background: "rgb(var(--c-surface))",
          border: "1px solid rgb(var(--c-line))",
          boxShadow: "0 24px 70px rgba(0,0,0,.5)",
        }}
      >
        {/* overscroll-contain: 스크롤이 끝에 닿아도 뒤 페이지로 전파되지 않게 한다 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <TermsBody />
        </div>

        <div className="shrink-0 p-5" style={{ borderTop: "1px solid rgb(var(--c-line))" }}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 size-4 !w-auto shrink-0"
            />
            <span className="text-sm text-neutral-300">
              위 내용을 읽었으며 이에 동의합니다.
            </span>
          </label>

          <button
            onClick={agree}
            disabled={!checked || pending}
            className="mt-3 h-12 w-full rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
          >
            {pending ? "처리 중…" : "동의하고 시작하기"}
          </button>

          <p className="mt-2 text-center text-xs text-neutral-500">
            동의하지 않으면 서비스를 이용할 수 없어요.
          </p>
        </div>
      </div>
    </div>
  );
}