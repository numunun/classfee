"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 학생 본인의 오늘 CIP 참석 여부 신고 (차수별). 검증은 DB 함수가 담당한다.
export async function reportNightStudy(session: number, status: string, reason: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("report_night_study", {
    p_session: session,
    p_status: status,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/student");
  revalidatePath("/board", "layout");
}