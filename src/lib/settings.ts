import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

// settings 의 RLS 는 "to authenticated" 이므로 반드시 쿠키가 붙은 서버 클라이언트로 조회해야 한다.
// (기존 버전은 쿠키 없는 익명 클라이언트를 써서 항상 0행 -> null 이 반환됐음)
export async function getSettings(): Promise<Settings | null> {
  const supabase = createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return (data as Settings) ?? null;
}