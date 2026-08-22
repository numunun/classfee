import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CleaningForm } from "@/components/CleaningForm";

export default async function CleaningPage() {
  const supabase = createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, name, student_number")
    .order("student_number");

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
      <h1 className="mb-4 mt-2 text-lg font-semibold">청소 현황</h1>
      <CleaningForm students={students ?? []} />
    </>
  );
}
