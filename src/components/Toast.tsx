"use client";

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
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          // 색은 전부 인라인으로 고정한다. 유틸리티 클래스를 쓰면
          // 밝은 테마의 색 반전 규칙에 걸려 검은 배경에 검은 글자가 된다.
          <div
            key={t.id}
            className="animate-[slidein_0.2s_ease-out] rounded-xl px-4 py-3 text-sm"
            style={{
              background: t.kind === "error" ? "#DC2626" : "#1B1B1F",
              color: "#FFFFFF",
              boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}