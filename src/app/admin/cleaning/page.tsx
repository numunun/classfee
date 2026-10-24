import { createClient } from "@/lib/supabase/server";
import { CleaningForm } from "@/components/CleaningForm";
import { PageHeader } from "@/components/PageHeader";

export default async function CleaningPage() {
  const supabase = createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, name, student_number")
    .order("student_number");

  return (
    <>
      <PageHeader back={{ href: "/admin", label: "대시보드" }} title="청소 현황" />
      <CleaningForm students={students ?? []} />
    </>
  );
}
