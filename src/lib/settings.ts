import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

// settings 의 RLS 는 "to authenticated" 이므로 쿠키가 붙은 서버 클라이언트로 조회해야 한다.
// cache() 로 같은 요청 안에서의 중복 조회를 없앤다.
export const getSettings = cache(async (): Promise<Settings | null> => {
  const supabase = createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return (data as Settings) ?? null;
});