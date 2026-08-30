export const SCHOOL_DOMAIN = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN || "";

export type Role = "student" | "admin";
export type FineType = "sleep" | "late" | "cleaning";
export type FineStatus = "unpaid" | "pending_approval" | "paid" | "doubled";
export type PaymentStatus = "pending" | "approved" | "rejected";

export const FINE_TYPE_LABEL: Record<FineType, string> = {
  sleep: "수업 시간 수면",
  late: "지각",
  cleaning: "청소 불참",
};

export const FINE_STATUS_LABEL: Record<FineStatus, string> = {
  unpaid: "미납",
  pending_approval: "승인 대기",
  paid: "완납",
  doubled: "미납 (2배)",
};

export interface Student {
  id: string;
  student_number: number | null;
  name: string;
  google_email: string;
  role: Role;
  is_independent?: boolean;
  auth_user_id: string | null;
}

export interface Settings {
  id: number;
  payment_deadline_days: number;
  double_fine_enabled: boolean;
  account_bank: string;
  account_number: string;
  account_holder: string;
  sleep_fine_unit: number;
  late_fine_amount: number;
  cleaning_fine_amount: number;
  neis_atpt_code: string;
  neis_school_code: string;
  class_label: string;
}

export interface Fine {
  id: string;
  student_id: string;
  type: FineType;
  amount: number;
  reason: string | null;
  occurred_date: string;
  due_date: string;
  status: FineStatus;
  created_at: string;
  deleted_at: string | null;
  delete_reason?: string | null;
}

// 실제 청구액 (기한 초과 2배)
export function payable(f: Pick<Fine, "amount" | "status">): number {
  return f.status === "doubled" ? f.amount * 2 : f.amount;
}

export function won(n: number): string {
  return "₩" + n.toLocaleString("ko-KR");
}

export function shortDate(d: string): string {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}
