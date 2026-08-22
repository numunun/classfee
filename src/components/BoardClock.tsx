"use client";

import { useEffect, useState } from "react";

// 서버/클라이언트 시간이 어긋나 hydration 경고가 나지 않도록 마운트 후에만 그린다.
export function BoardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // 초 단위로 흐르는 현재 시각. 다음 "정각 초"에 맞춰 시작해 밀림을 막는다.
    const align = 1000 - (Date.now() % 1000);
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, align);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // 첫 렌더에서는 자리만 잡아둔다 (레이아웃이 튀지 않게)
  if (!now) return <span className="opacity-0">00월 00일 0요일 00:00:00</span>;

  return (
    <>
      {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })}
      <span className="mx-2 opacity-40">·</span>
      <span className="tabular-nums">
        {now.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
      </span>
    </>
  );
}