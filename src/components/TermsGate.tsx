"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TermsByVersion } from "@/components/TermsByVersion";
import { useToast } from "@/components/Toast";
import { termsDateLabel } from "@/lib/terms";

/** 「나중에」를 누른 개정 안내를 기기에 기억하는 키 (판마다 따로) */
const dismissKey = (version: string) => `terms-notice-dismissed:${version}`;

/**
 * 약관 동의 창. 화면 전체를 덮는다.
 *
 *  - required: 지금 시행 중인 판에 동의하지 않은 사용자. 동의해야 서비스를 쓸 수 있다.
 *  - notice:   시행 예정인 개정판의 사전 안내. 한 번 보여주고, 미리 동의하거나 「나중에」로
 *              닫을 수 있다. 닫으면 이 기기에서는 다시 띄우지 않는다.
 *              시행일이 되면 그때 required 로 다시 뜬다.
 * 이미 가입한 학생도 대상이므로 온보딩이 아니라 별도 관문으로 둔다.
 */
export function TermsGate({
  version,
  mode = "required",
}: {
  /** 동의받을 약관 판. 서버가 한국 날짜로 정해서 넘긴다 */
  version: string;
  mode?: "required" | "notice";
}) {
  const notice = mode === "notice";
  const [checked, setChecked] = useState(false);
  // notice 는 「나중에」를 눌렀는지 기기 저장소를 확인한 뒤에 띄운다 (깜빡임 방지로 처음엔 숨김)
  const [open, setOpen] = useState(!notice);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!notice) return;
    try {
      if (localStorage.getItem(dismissKey(version))) return;
    } catch {
      // 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 그냥 띄운다
    }
    setOpen(true);
  }, [notice, version]);

  function agree() {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("agree_terms", { p_version: version });
      if (error) {
        toast(error.message, "error");
        return;
      }
      if (notice) toast("개정 약관에 미리 동의했어요.");
      setOpen(false);
      router.refresh();
    });
  }

  function later() {
    try {
      localStorage.setItem(dismissKey(version), "1");
    } catch {
      // 기억하지 못해도 이번에는 닫는다
    }
    setOpen(false);
  }

  if (!open) return null;

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
          {notice && (
            <div className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-400">
              <b>{termsDateLabel(version)}부터 아래 개정 약관이 시행돼요.</b>
              <br />
              그 전까지는 동의하지 않아도 서비스를 이용할 수 있지만,{" "}
              {termsDateLabel(version)}부터는 동의해야 이용할 수 있어요.
            </div>
          )}
          <TermsByVersion version={version} />
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
            {pending ? "처리 중…" : notice ? "미리 동의하기" : "동의하고 시작하기"}
          </button>

          {notice ? (
            <button
              onClick={later}
              disabled={pending}
              className="mt-2 h-11 w-full rounded-xl text-sm font-medium text-neutral-400 disabled:opacity-40"
            >
              나중에 할게요
            </button>
          ) : (
            <p className="mt-2 text-center text-xs text-neutral-500">
              동의하지 않으면 서비스를 이용할 수 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
