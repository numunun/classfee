"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 모달을 <body> 직속으로 그린다.
 *
 * 페이지 안에 두면 backdrop-filter 가 화면 전체를 흐리지 못한다.
 * backdrop-filter 는 "자기가 속한 쌓임 맥락" 아래만 흐리게 하는데,
 * 카드들이 유리 효과(backdrop-filter) 때문에 각자 맥락을 만들어
 * z-index 를 아무리 올려도 바깥 영역에는 닿지 않는다.
 */
export function Modal({
  onClose,
  align = "center",
  children,
}: {
  onClose: () => void;
  /** 모바일에서 아래에 붙일지 (시트 형태) */
  align?: "center" | "bottom";
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 모달이 열려 있는 동안 뒤 페이지 스크롤을 막는다
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc 로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[100] grid p-4 sm:place-items-center ${
        align === "bottom" ? "place-items-end" : "place-items-center"
      }`}
      style={{
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
    >
      {/* 안쪽 클릭이 배경으로 새어나가 모달이 닫히지 않게 막는다 */}
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
        {children}
      </div>
    </div>,
    document.body
  );
}