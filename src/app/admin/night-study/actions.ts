"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth";
import { ACADEMY_SESSIONS } from "@/lib/night-study";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const me = await getCurrentStudent();
  if (!me || me.role !== "admin") throw new Error("권한이 없습니다.");
  return me;
}

const VALID = ["present", "academy", "hospital", "special", "other"];

function touch() {
  revalidatePath("/admin/night-study");
  revalidatePath("/student");
  revalidatePath("/board", "layout");
}

// 관리자가 특정 학생의 특정 차수 출결을 지정한다.
export async function setNightStatus(
  studentId: string,
  studyDate: string,
  session: number,
  status: string,
  reason?: string
) {
  const me = await assertAdmin();
  if (!VALID.includes(status)) throw new Error("올바르지 않은 상태입니다.");
  if (session < 1 || session > 3) throw new Error("올바르지 않은 차수입니다.");

  const supabase = createClient();
  const { error } = await supabase.from("night_study_records").upsert(
    {
      student_id: studentId,
      study_date: studyDate,
      session,
      status,
      reason: reason?.trim() || null,
      self_reported: false, // 관리자 처리 표시. 학생이 덮어쓸 수 없게 된다.
      recorded_by: me.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,study_date,session" }
  );
  if (error) throw new Error(error.message);
  touch();
}

// 기록을 지워 기본값(참석 / 학원 스케줄 / 자주반)으로 되돌린다.
export async function clearNightStatus(
  studentId: string,
  studyDate: string,
  session: number
) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("night_study_records")
    .delete()
    .eq("student_id", studentId)
    .eq("study_date", studyDate)
    .eq("session", session);
  if (error) throw new Error(error.message);
  touch();
}

// 학원 가는 요일을 통째로 교체한다.
// 학원 가는 날에도 1차는 참석하므로 2·3차에만 기록한다.
export async function saveAcademyDays(studentId: string, weekdays: number[]) {
  const me = await assertAdmin();
  const supabase = createClient();

  const clean = Array.from(new Set(weekdays)).filter((d) => d >= 1 && d <= 4);

  const del = await supabase.from("academy_schedules").delete().eq("student_id", studentId);
  if (del.error) throw new Error(del.error.message);

  if (clean.length > 0) {
    const payload = clean.flatMap((weekday) =>
      ACADEMY_SESSIONS.map((session) => ({
        student_id: studentId,
        weekday,
        session,
        created_by: me.id,
      }))
    );
    const { error } = await supabase.from("academy_schedules").insert(payload);
    if (error) throw new Error(error.message);
  }
  touch();
}

// 자주반 여부 토글 (명단 속성)
export async function setIndependent(studentId: string, value: boolean) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .update({ is_independent: value })
    .eq("id", studentId);
  if (error) throw new Error(error.message);
  touch();
}