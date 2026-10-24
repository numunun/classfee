"use client";

import { useEffect, useRef } from "react";
import type { Theme } from "@/lib/themes";

/**
 * 커스텀 테마 사용자의 멤버십 카드.
 * 지갑 속 회원 카드처럼 팀 색 바탕에 이름·학번·로고만 올린다.
 *
 * 카드를 기울이거나(휴대폰) 손가락·마우스를 올리면 팀 색 홀로그램이 따라 움직인다.
 * 빛 효과의 모양은 themeCss() 가 심는 .tm-holo / .tm-glint 가 담당하고,
 * 여기서는 위치(--mx, --my)만 넣어준다.
 *
 * 글자색은 인라인 style 로 지정한다 — 밝은 테마의 클래스 반전 규칙에 걸리지 않도록.
 */
export function ThemeBanner({
  theme,
  name,
  studentNumber,
}: {
  theme: Theme;
  name: string;
  studentNumber: number | null;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const set = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", String(Math.min(1, Math.max(0, x))));
        el.style.setProperty("--my", String(Math.min(1, Math.max(0, y))));
      });
    };

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const onLeave = () => set(0.5, 0.5);
    // 안드로이드 등 권한 없이 기울기를 주는 기기에서만 동작한다 (iOS 는 권한이 필요해 건너뛴다)
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      set(0.5 + e.gamma / 60, 0.5 + (e.beta - 45) / 90);
    };

    el.addEventListener("pointermove", onPointer);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  const light = theme.mode === "light";
  const title = theme.nickname ?? name;

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden rounded-[1.5rem] px-5 pb-5 pt-4"
      style={{
        background: theme.deep,
        color: "#fff",
        minHeight: "11.5rem",
        boxShadow: light
          ? `0 14px 36px ${theme.accent}40, inset 0 0 0 1px rgba(255,255,255,.08)`
          : "0 14px 36px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08)",
      }}
    >
      {/* 오른쪽 위에서 번지는 팀 색 */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(120% 90% at 100% 0%, ${theme.accent}40, transparent 60%)`,
        }}
      />

      {/* 카드 그림: 오른쪽에 붙이고 왼쪽(글자 쪽)으로 갈수록 흐려지게 */}
      {theme.cardImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.cardImage}
          alt=""
          aria-hidden
          className={`pointer-events-none absolute -z-10 w-auto select-none object-contain ${
            theme.cardImageAlign === "top"
              ? "right-14 top-0 h-[125%] max-w-[58%] object-top"
              : "bottom-0 right-0 h-[112%] max-w-[62%] object-right-bottom"
          }`}
          style={{
            WebkitMaskImage: "linear-gradient(to left, #000 45%, transparent 100%)",
            maskImage: "linear-gradient(to left, #000 45%, transparent 100%)",
            opacity: 0.85,
          }}
        />
      )}

      <div aria-hidden className="tm-holo pointer-events-none absolute inset-0" />
      <div aria-hidden className="tm-glint pointer-events-none absolute inset-0" />

      <div className="relative flex h-full min-h-[10rem] flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <p
            className="pt-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: "rgba(255,255,255,.7)" }}
          >
            {theme.team}
          </p>
          {theme.logo ? (
            // 흰 바탕 로고(한화)는 흰 타일 위에, 투명 로고는 타일 없이 그대로 둔다
            <div
              className="grid size-12 shrink-0 place-items-center rounded-2xl"
              style={light ? { background: "#fff" } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={theme.logo} alt="" className="h-9 w-10 object-contain" />
            </div>
          ) : (
            <span className="text-3xl leading-none">{theme.emoji}</span>
          )}
        </div>

        <div className="mt-6">
          <p className="text-[1.875rem] font-bold leading-none tracking-tight">{title}</p>
          <p className="mt-2 flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,.72)" }}>
            <span className="tabular-nums">
              {studentNumber ?? ""}
              {theme.nickname ? ` · ${name}` : ""}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[0.6875rem] font-bold"
              style={{ background: theme.accent, color: "#fff" }}
            >
              {theme.tagline}
            </span>
          </p>
          <p
            // 그림이 있으면 글자가 사진 위로 넘어가 지저분해지므로 왼쪽 절반에서 자른다
            className={`mt-3 truncate text-[0.625rem] font-semibold uppercase tracking-[0.14em] ${
              theme.cardImage ? "max-w-[55%]" : ""
            }`}
            style={{ color: "rgba(255,255,255,.45)" }}
          >
            {theme.motto}
          </p>
        </div>
      </div>

      {/* 카드 아래 팀 색 띠 */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: theme.accent }} />
    </section>
  );
}
