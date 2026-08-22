import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStudent();
  if (me.role !== "admin") redirect("/student"); // 권한은 DB role 로만 판단

  return <PageShell>{children}</PageShell>;
}