import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** 특정 날짜의 석식 메뉴 (직접 입력분). 없으면 null */
export const getDinner = cache(async (dateISO: string): Promise<string | null> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("dinner_menus")
    .select("menu")
    .eq("meal_date", dateISO)
    .maybeSingle();
  return (data as { menu: string } | null)?.menu ?? null;
});