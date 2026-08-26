"use client";

import { useState } from "react";
import { selfRegister } from "@/app/onboarding/actions";
import { useToast } from "@/components/Toast";

export function OnboardingForm() {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await selfRegister(fd);
          toast("등록이 완료됐어요.");
          // 클라이언트 라우터 캐시가 "미등록" 상태를 붙잡고 있어서
          // router.replace 로는 넘어가지 않는다. 브라우저 통짜 이동으로 확실히 새로 연다.
          window.location.href = "/student";
        } catch (e) {
          toast((e as Error).message, "error");
          setPending(false);
        }
      }}
      className="space-y-4 rounded-2xl bg-surface p-5"
    >
      <div>
        <label htmlFor="name">이름</label>
        <input id="name" name="name" required maxLength={20} placeholder="XXX" className="mt-1.5" />
      </div>
      <div>
        <label htmlFor="studentNumber">학번</label>
        <input
          id="studentNumber"
          name="studentNumber"
          type="number"
          inputMode="numeric"
          required
          placeholder="209XX"
          className="mt-1.5"
        />
      </div>
      <button
        disabled={pending}
        className="h-12 w-full rounded-xl bg-white font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "등록 중…" : "등록하고 시작하기"}
      </button>
    </form>
  );
}