export const SCHOOL_DOMAIN = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN || "";

export type Role = "student" | "admin";
export type FineType = "late" | "cleaning" | "other";
export type FineStatus = "unpaid" | "pending_approval" | "paid" | "doubled";
export type PaymentStatus = "pending" | "approved" | "rejected";

export const FINE_TYPE_LABEL: Record<FineType, string> = {
  late: "지각",
  cleaning: "청소 불참",
  other: "기타",
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
  overdue_multiplier?: number;
}

/** 실제로 내야 할 금액. 연체 배수를 반영한다. (규정 ⑧⑨: 7일마다 2배, 최대 4배) */
export function payable(f: Pick<Fine, "amount" | "status" | "overdue_multiplier">): number {
  const m = f.overdue_multiplier ?? (f.status === "doubled" ? 2 : 1);
  return f.amount * m;
}

export function won(n: number): string {
  return "₩" + n.toLocaleString("ko-KR");
}

export function shortDate(d: string): string {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}
