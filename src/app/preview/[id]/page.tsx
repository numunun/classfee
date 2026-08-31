import { redirect, notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentView } from "@/components/StudentView";
import type { Student } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "학생 화면 미리보기" };

/**
 * 관리자가 특정 학생의 화면을 그대로(테마 포함) 확인하는 페이지.
 *
 * /admin 아래가 아니라 별도 경로에 두는 이유:
 * admin/layout.tsx 는 "관리자 본인"의 테마와 배경을 주입한다.
 * 그 안에 두면 관리자 테마 위에 학생 테마가 겹쳐서
 * 배경 로고가 두 개 보이고, 밝은 테마의 색 반전 규칙이 남아 글자가 뒤집힌다.
 */
export default async function PreviewPage({ params }: { params: { id: string } }) {
  const me = await requireStudent();
  if (me.role !== "admin") redirect("/student");

  const supabase = createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_number, name, google_email, role, auth_user_id, is_independent")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  return <StudentView me={data as Student} readOnly />;
}