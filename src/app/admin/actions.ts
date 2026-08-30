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
  revalidatePath("/", "layout");
}

// ---------- 기타 벌금 (금액을 직접 입력) ----------
export async function createOtherFine(formData: FormData) {
  const me = await assertAdmin();
  const supabase = createClient();
  const s = await getSettings();

  const studentId = String(formData.get("studentId"));
  const occurred = String(formData.get("occuredDate"));
  const reason = String(formData.get("reason") || "").trim();
  const amount = Number(formData.get("amount") || 0);

  if (!studentId) throw new Error("학생을 선택하세요.");
  if (!reason) throw new Error("사유를 입력하세요.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("금액을 올바르게 입력하세요.");
  if (amount > 100000) throw new Error("금액이 너무 큽니다.");

  const { error } = await supabase.from("fines").insert({
    student_id: studentId,
    type: "other",
    amount: Math.round(amount),
    reason,
    occurred_date: occurred,
    due_date: addDays(occurred, s.payment_deadline_days),
    created_by: me.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
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
  revalidatePath("/", "layout");
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
// 서버 액션이 throw 하면 프로덕션에서 메시지가 가려지므로, 실패도 값으로 돌려준다.
export type ActionResult = { ok: true } | { ok: false; message: string };

export async function addStudent(formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const numberRaw = String(formData.get("number") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role")) === "admin" ? "admin" : "student";

  if (!name) return { ok: false, message: "이름을 입력하세요." };
  if (!email) return { ok: false, message: "이메일을 입력하세요." };

  let studentNumber: number | null = null;
  if (numberRaw) {
    const n = Number(numberRaw);
    if (!Number.isInteger(n) || n < 10101 || n > 69999) {
      return { ok: false, message: "학번을 올바르게 입력하세요. (예: 20935)" };
    }
    studentNumber = n;
  }

  const supabase = createClient();
  const { error } = await supabase.from("students").insert({
    student_number: studentNumber,
    name,
    google_email: email,
    role,
  });

  if (error) {
    // 23505 = unique_violation
    if (error.code === "23505") {
      const dup = error.message.includes("student_number") ? "학번" : "이메일";
      return { ok: false, message: `이미 등록된 ${dup}입니다.` };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/students");
  return { ok: true };
}

export async function setRole(
  studentId: string,
  role: "student" | "admin"
): Promise<ActionResult> {
  const me = await assertAdmin();

  // 마지막 관리자가 스스로 권한을 내리면 아무도 관리할 수 없게 된다.
  if (role === "student" && studentId === me.id) {
    const supabase = createClient();
    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { ok: false, message: "마지막 관리자는 권한을 내릴 수 없어요." };
    }
  }

  const supabase = createClient();
  const { error } = await supabase.from("students").update({ role }).eq("id", studentId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/students");
  return { ok: true };
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
