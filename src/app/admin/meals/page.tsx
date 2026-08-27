import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DinnerManager, type DinnerRow } from "@/components/DinnerManager";
import { todayISO } from "@/lib/night-study";

export const dynamic = "force-dynamic";
export const metadata = { title: "석식 관리" };

export default async function MealsPage() {
  const supabase = createClient();

  // 지난 것은 굳이 보여주지 않는다 (어제까지는 숨김)
  const { data } = await supabase
    .from("dinner_menus")
    .select("meal_date, menu")
    .gte("meal_date", todayISO())
    .order("meal_date");

  const rows = (data ?? []) as DinnerRow[];

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">
        ← 대시보드
      </Link>
      <h1 className="mb-1 mt-2 text-lg font-semibold">🌙 석식 관리</h1>
      <p className="mb-4 text-xs text-neutral-500">
        학교가 NEIS 에 중식만 올려서, 석식은 여기에 직접 등록해요. 금요일은 석식이 없어요.
      </p>
      <DinnerManager rows={rows} />
    </>
  );
}