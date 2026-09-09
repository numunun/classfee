import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { FineForms } from "@/components/FineForms";

export const dynamic = "force-dynamic";

export default async function NewFinePage() {
  const supabase = createClient();
  const [{ data: students }, settings] = await Promise.all([
    supabase.from("students").select("id, name, student_number").order("student_number"),
    getSettings(),
  ]);

  const list = students ?? [];
  const base = settings?.late_fine_amount ?? 1000;
  const cap = settings?.late_fine_cap ?? 16000;
  const start = settings?.late_policy_start ?? null;

  // 학생별 "다음 지각 벌금"을 미리 계산해 화면에 보여준다.
  // 실제 부과 금액은 서버(DB 함수)가 다시 계산하므로 여기 값은 안내용이다.
  const nextAmount: Record<string, number> = {};
  if (start) {
    const { data: lates } = await supabase
      .from("fines")
      .select("student_id")
      .eq("type", "late")
      .is("deleted_at", null)
      .gte("occurred_date", start);

    const counts = new Map<string, number>();
    for (const r of (lates ?? []) as { student_id: string }[]) {
      counts.set(r.student_id, (counts.get(r.student_id) ?? 0) + 1);
    }
    for (const s of list) {
      nextAmount[s.id] = Math.min(base * 2 ** (counts.get(s.id) ?? 0), cap);
    }
  }

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
      <h1 className="mb-4 mt-2 text-lg font-semibold">새 벌금 부과</h1>
      <FineForms students={list} lateAmount={base} nextAmount={nextAmount} />
    </>
  );
}