import type { Metadata } from "next";
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
};

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
      <body className="bg-ink text-neutral-100 antialiased">
        <ToastProvider>
          {children}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}