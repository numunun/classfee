"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

async function assertAdmin() {
  const me = await getCurrentStudent();
  if (!me || me.role !== "admin") throw new Error("권한이 없습니다");
  return me;
}

async function getSettings() {
  const supabase = createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return data!;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- 수면 벌금 ----------
export async function createSleepFine(formData: FormData) {
  const me = await assertAdmin();
  const supabase = createClient();
  const s = await getSettings();

  const studentId = String(formData.get("studentId"));
  const occurred = String(formData.get("occurredDate"));
  const periods = (formData.getAll("periods") as string[]).map(Number).filter(Boolean);
  const sleepCount = Number(formData.get("sleepCount") || 1);
  const file = formData.get("photo") as File | null;

  if (!studentId || periods.length === 0) throw new Error("학생과 교시를 선택하세요");
  if (!file || file.size === 0) throw new Error("증거 사진을 첨부하세요");

  const amount = periods.length * s.sleep_fine_unit; // 금액은 서버가 계산

  // 증거 사진 업로드 (선택)
  let photoPath: string | null = null;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있어요");
    if (file.size > 8 * 1024 * 1024) throw new Error("사진은 8MB 이하여야 해요");
    const path = `${studentId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("evidence").upload(path, file);
    if (error) throw new Error("사진 업로드 실패: " + error.message);
    photoPath = path;
  }

  const { data: fine, error: fErr } = await supabase
    .from("fines")
    .insert({
      student_id: studentId,
      type: "sleep",
      amount,
      reason: `${periods.join(", ")}교시`,
      occurred_date: occurred,
      due_date: addDays(occurred, s.payment_deadline_days),
      created_by: me.id,
    })
    .select("id")
    .single();
  if (fErr) throw new Error(fErr.message);

  await supabase.from("sleep_fine_details").insert({
    fine_id: fine.id,
    periods,
    sleep_count: sleepCount,
    evidence_photo_url: photoPath,
  });

  revalidatePath("/admin");
}

// ---------- 지각 벌금 ----------
export async function createLateFine(formData: FormData) {
  const me = await assertAdmin();
  const supabase = createClient();
  const s = await getSettings();

  const studentId = String(formData.get("studentId"));
  const occurred = String(formData.get("occurredDate"));
  const reason = String(formData.get("reason") || "");
  if (!studentId) throw new Error("학생을 선택하세요");

  const { error } = await supabase.from("fines").insert({
    student_id: studentId,
    type: "late",
    amount: s.late_fine_amount,
    reason: reason || "지각",
    occurred_date: occurred,
    due_date: addDays(occurred, s.payment_deadline_days),
    created_by: me.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------- 청소 출결 저장 (불참 -> 트리거가 자동 벌금) ----------
export async function saveCleaning(formData: FormData) {
  const me = await assertAdmin();
  const supabase = createClient();

  const date = String(formData.get("date"));
  const area = String(formData.get("area") || "");
  // absent: 불참 처리할 학생 id 들
  const absent = new Set(formData.getAll("absent") as string[]);
  const allStudents = (formData.getAll("studentId") as string[]);

  const rows = allStudents.map((sid) => ({
    student_id: sid,
    cleaning_date: date,
    area,
    attended: !absent.has(sid),
    recorded_by: me.id,
  }));

  const { error } = await supabase
    .from("cleaning_records")
    .upsert(rows, { onConflict: "student_id,cleaning_date,area" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------- 벌금 소프트 삭제 ----------
export async function softDeleteFine(fineId: string, reason: string) {
  const me = await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("fines")
    .update({ deleted_at: new Date().toISOString(), deleted_by: me.id, delete_reason: reason })
    .eq("id", fineId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ---------- 입금 승인 / 거절 ----------
export async function decidePayment(
  requestId: string,
  decision: "approved" | "rejected",
  rejectReason?: string
) {
  const me = await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("payment_requests")
    .update({
      status: decision,
      reviewed_by: me.id,
      reviewed_at: new Date().toISOString(),
      reject_reason: decision === "rejected" ? rejectReason ?? null : null,
    })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
}

// ---------- 학생 추가 / 역할 변경 ----------
export async function addStudent(formData: FormData) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("students").insert({
    student_number: Number(formData.get("number")) || null,
    name: String(formData.get("name")),
    google_email: String(formData.get("email")).toLowerCase(),
    role: (formData.get("role") as string) === "admin" ? "admin" : "student",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/students");
}

export async function setRole(studentId: string, role: "student" | "admin") {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase.from("students").update({ role }).eq("id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/students");
}

// ---------- 설정 저장 ----------
export async function saveSettings(formData: FormData) {
  await assertAdmin();
  const supabase = createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      account_bank: String(formData.get("bank") || ""),
      account_number: String(formData.get("number") || ""),
      account_holder: String(formData.get("holder") || ""),
      payment_deadline_days: Number(formData.get("deadline") || 7),
      double_fine_enabled: formData.get("double") === "on",
      late_fine_amount: Number(formData.get("late") || 1000),
      cleaning_fine_amount: Number(formData.get("cleaning") || 2000),
      neis_atpt_code: String(formData.get("atpt") || "G10").trim(),
      neis_school_code: String(formData.get("schoolCode") || "").trim(),
      class_label: String(formData.get("classLabel") || "").trim() || "우리 반",
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidateTag("settings");
  revalidatePath("/admin/settings");
}
