import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudentManager } from "@/components/StudentManager";
import type { Student } from "@/lib/types";

export default async function StudentsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_number, name, google_email, role, auth_user_id")
    .order("student_number");

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
      <h1 className="mb-4 mt-2 text-lg font-semibold">학생 관리</h1>
      <StudentManager students={(data ?? []) as Student[]} />
    </>
  );
}
