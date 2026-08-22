import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "학급 관리",
    template: "%s · 학급 관리",
  },
  description: "CIP 출결 · 급식 · 학급 벌금을 한곳에서",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
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
