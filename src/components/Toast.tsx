"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: number; message: string; kind: "success" | "error" };
const ToastContext = createContext<(message: string, kind?: "success" | "error") => void>(
  () => {}
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((cur) => [...cur, { id, message, kind }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* 아이폰 홈 화면 앱에서 하단 홈 바에 가리지 않게 safe-area 만큼 띄운다 */}
      <div
        className="pointer-events-none fixed inset-x-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:items-end"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {toasts.map((t) => (
          // 색은 전부 인라인으로 고정한다. 유틸리티 클래스를 쓰면
          // 밝은 테마의 색 반전 규칙에 걸려 검은 배경에 검은 글자가 된다.
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className="flex w-fit max-w-sm animate-[slidein_0.2s_ease-out] items-center gap-2.5 rounded-2xl py-3 pl-3.5 pr-4 text-sm font-medium"
            style={{
              background: t.kind === "error" ? "rgba(220,38,38,.95)" : "rgba(32,32,36,.92)",
              color: "#FFFFFF",
              boxShadow: "0 10px 30px rgba(0,0,0,.35)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {t.kind === "error" ? (
              <CircleAlert className="size-[1.125rem] shrink-0" aria-hidden />
            ) : (
              <CircleCheck className="size-[1.125rem] shrink-0" style={{ color: "#4ADE80" }} aria-hidden />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}