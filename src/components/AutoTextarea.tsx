"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

/**
 * 내용 길이에 맞춰 높이가 자동으로 늘어나는 textarea.
 * 브라우저 기본 textarea 는 높이가 고정이라 넘치면 스크롤만 생긴다.
 * scrollHeight(내용의 실제 높이)를 읽어 height 에 그대로 넣어준다.
 */
export function AutoTextarea({
  minRows = 4,
  maxRows = 24,
  value,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number; maxRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize(el: HTMLTextAreaElement) {
    // 먼저 높이를 지워야 scrollHeight 가 줄어든 내용도 반영한다
    el.style.height = "auto";

    const line = parseFloat(getComputedStyle(el).lineHeight || "24");
    const pad =
      parseFloat(getComputedStyle(el).paddingTop) +
      parseFloat(getComputedStyle(el).paddingBottom);

    const min = line * minRows + pad;
    const max = line * maxRows + pad;
    const next = Math.min(Math.max(el.scrollHeight, min), max);

    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }

  // 처음 그릴 때와 값이 밖에서 바뀔 때(수정 모드 진입 등) 맞춰준다
  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [value, minRows, maxRows]);

  return (
    <textarea
      {...rest}
      value={value}
      ref={ref}
      onInput={(e) => resize(e.currentTarget)}
      style={{ resize: "none", ...rest.style }}
    />
  );
}