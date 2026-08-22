import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 는 루트 middleware.ts 에서 "middleware" 라는 이름의 export 만 인식한다.
// 또한 src/ 디렉터리 구조에서는 이 파일이 반드시 src/ 안에 있어야 실행된다.
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};