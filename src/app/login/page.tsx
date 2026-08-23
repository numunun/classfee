"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SCHOOL_DOMAIN } from "@/lib/types";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // 학교 도메인 계정으로 로그인 화면 유도 (UX). 진짜 차단은 콜백에서.
        queryParams: SCHOOL_DOMAIN ? { hd: SCHOOL_DOMAIN } : undefined,
      },
    });
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-blue-600/90 text-2xl">
          🏫
        </div>
        <h1 className="text-xl font-semibold">학급 관리 시스템</h1>
        <p className="mt-2 text-sm text-neutral-400">
          학교 구글 계정으로 로그인하세요
          {SCHOOL_DOMAIN ? ` (@${SCHOOL_DOMAIN})` : ""}
        </p>

        <button
          onClick={signIn}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z" />
            <path fill="#FBBC05" d="M10.3 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.8-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.8-3.7-13.7-9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          {loading ? "이동 중…" : "Google 계정으로 계속하기"}
        </button>

        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          처음 들어오시는 경우에도 같은 버튼으로 자동 가입돼요.
        </p>
      </div>
    </main>
  );
}