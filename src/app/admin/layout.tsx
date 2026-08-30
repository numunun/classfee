import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { getTheme, themeCss } from "@/lib/themes";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStudent();
  if (me.role !== "admin") redirect("/student"); // 권한은 DB role 로만 판단

  // 개인 테마는 관리 화면에도 그대로 적용한다.
  const theme = getTheme(me.student_number);

  return (
    <>
      {theme && (
        <>
          <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
          <ThemeBackdrop theme={theme} />
        </>
      )}
      <PageShell>{children}</PageShell>
    </>
  );
}