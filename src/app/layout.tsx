import type { Metadata, Viewport } from "next";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Footer } from "@/components/Footer";
import { getCurrentStudent } from "@/lib/auth";
import { getTheme, themeCss } from "@/lib/themes";

export const metadata: Metadata = {
  title: {
    default: "학급 관리",
    template: "%s · 학급 관리",
  },
  description: "CIP 출결 · 급식 · 학급 벌금을 한곳에서",
  appleWebApp: { capable: true, title: "학급 관리", statusBarStyle: "black-translucent" },
};

// 브라우저 주소창·상태바 색을 페이지 배경과 맞춘다. 밝은 테마에서 위쪽만 검게 뜨지 않도록.
export async function generateViewport(): Promise<Viewport> {
  const me = await getCurrentStudent().catch(() => null);
  const theme = getTheme(me?.student_number);
  return { themeColor: theme?.palette?.ink ?? "#0e0e10" };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 테마 색을 레이아웃에서 넣는다. 페이지가 넣으면 로딩 화면(loading.tsx)이
  // 뜨는 동안에는 아직 style 이 없어서 기본 색으로 보인다.
  // 관리자 미리보기처럼 다른 사람 테마를 써야 하는 화면은
  // 페이지에서 같은 :root 를 다시 선언해 덮어쓴다 (나중에 선언된 쪽이 이긴다).
  const me = await getCurrentStudent().catch(() => null);
  const theme = getTheme(me?.student_number);

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
      </head>
      {/* 내용이 짧은 화면에서도 푸터가 화면 맨 아래에 붙도록 세로 flex 로 둔다 */}
      <body className="flex min-h-dvh flex-col bg-ink text-neutral-100 antialiased">
        <ToastProvider>
          <div className="flex-1">{children}</div>
          <Footer />
          <RegisterSW />
        </ToastProvider>
      </body>
    </html>
  );
}