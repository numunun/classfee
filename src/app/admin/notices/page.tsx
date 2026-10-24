import { createClient } from "@/lib/supabase/server";
import { NoticeManager, type NoticeRow } from "@/components/NoticeManager";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "공지" };

export default async function NoticesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, title, body, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        back={{ href: "/admin", label: "대시보드" }}
        title="공지"
        description="올린 공지는 지우거나 내릴 때까지 학생 화면에 계속 남아요."
      />
      <NoticeManager rows={(data ?? []) as NoticeRow[]} />
    </>
  );
}