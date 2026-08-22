"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 전자칠판처럼 계속 띄워두는 화면용. 주기적으로 서버 데이터를 다시 가져온다.
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}