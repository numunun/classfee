"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const me = await getCurrentStudent();
  if (!me || me.role !== "admin") throw new Error("권한이 없습니다.");
  return me;
}

function touch() {
  revalidatePath("/admin/notices");
  revalidatePath("/student");
}

export async function createNotice(formData: FormData) {
  const me = await assertAdmin();
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!title) throw new Error("제목을 입력하세요.");
  if (title.length > 60) throw new Error("제목이 너무 깁니다. (60자 이내)");
  if (body.length > 2000) throw new Error("내용이 너무 깁니다.");

  const supabase = createClient();
  const { error } = await supabase.from("notices").insert({
    title,
    body: body || null,
    created_by: me.id,
  });
  if (error) throw new Error(error.message);
  touch();
}

export async function updateNotice(id: string, title: string, body: string) {
  await assertAdmin();
  const t = title.trim();
  if (!t) throw new Error("제목을 입력하세요.");

  const supabase = createClient();
  const { error } = await supabase
    .from("notices")
    .update({ title: t, body: body.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  touch();
}

// 내리기 / 다시 올리기. 지우지 않고 감추기만 한다.
export async function setNoticeActive(id: string, active: boolean) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("notices")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  touch();
}

export async function deleteNotice(id: string) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  touch();
}