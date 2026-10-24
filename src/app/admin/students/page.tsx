import { createClient } from "@/lib/supabase/server";
import { StudentManager } from "@/components/StudentManager";
import type { Student } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";

export default async function StudentsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_number, name, google_email, role, auth_user_id")
    .order("student_number");

  return (
    <>
      <PageHeader back={{ href: "/admin", label: "대시보드" }} title="학생 관리" />
      <StudentManager students={(data ?? []) as Student[]} />
    </>
  );
}
