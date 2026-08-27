"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth";
import { parseDinnerText } from "@/lib/dinner-parse";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const me = await getCurrentStudent();
  if (!me || me.role !== "admin") throw new Error("권한이 없습니다.");
  return me;
}

export async function saveDinners(text: string) {
  const me = await assertAdmin();
  const { rows, errors } = parseDinnerText(text);

  if (rows.length === 0) {
    throw new Error(errors[0] ?? "인식된 줄이 없어요.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("dinner_menus").upsert(
    rows.map((r) => ({
      meal_date: r.date,
      menu: r.menu,
      created_by: me.id,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "meal_date" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/admin/meals");
  revalidatePath("/student");
  return { saved: rows.length, errors };
}

export async function deleteDinner(date: string) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("dinner_menus").delete().eq("meal_date", date);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/meals");
  revalidatePath("/student");
}