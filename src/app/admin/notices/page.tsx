import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NoticeManager, type NoticeRow } from "@/components/NoticeManager";

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
      <Link href="/admin" className="text-sm text-neutral-500">
        ← 대시보드
      </Link>
      <h1 className="mb-1 mt-2 text-lg font-semibold">📢 공지</h1>
      <p className="mb-4 text-xs text-neutral-500">
        올린 공지는 지우거나 내릴 때까지 학생 화면에 계속 남아요.
      </p>
      <NoticeManager rows={(data ?? []) as NoticeRow[]} />
    </>
  );
}