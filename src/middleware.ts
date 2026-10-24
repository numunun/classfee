import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 는 이 파일에서 "middleware" 라는 이름의 export 만 인식한다.
// src/ 디렉터리 구조에서는 이 파일이 반드시 src/ 안에 있어야 실행된다. (루트에 두면 조용히 무시됨)
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // 서비스 워커·PWA 매니페스트는 로그인 전에도 받아져야 하므로 제외한다.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};