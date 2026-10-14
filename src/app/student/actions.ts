"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReportResult = { ok: true } | { ok: false; message: string };

// 학생 본인의 오늘 CIP 참석 여부 신고 (차수별). 검증은 DB 함수가 담당한다.
// throw 하면 프로덕션에서 「CIP 참여 대상이 아닙니다」 같은 이유가 가려지므로 값으로 돌려준다.
export async function reportNightStudy(
  session: number,
  status: string,
  reason: string
): Promise<ReportResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("report_night_study", {
    p_session: session,
    p_status: status,
    p_reason: reason,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/student");
  revalidatePath("/board", "layout");
  return { ok: true };
}