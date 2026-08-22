import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { FineForms } from "@/components/FineForms";

export default async function NewFinePage() {
  const supabase = createClient();
  const [{ data: students }, settings] = await Promise.all([
    supabase.from("students").select("id, name, student_number").order("student_number"),
    getSettings(),
  ]);
  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
      <h1 className="mb-4 mt-2 text-lg font-semibold">새 벌금 부과</h1>
      <FineForms
        students={students ?? []}
        sleepUnit={settings?.sleep_fine_unit ?? 2000}
        lateAmount={settings?.late_fine_amount ?? 1000}
      />
    </>
  );
}
