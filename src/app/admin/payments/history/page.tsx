import { createClient } from "@/lib/supabase/server";
import { PaymentHistory, type HistoryRow } from "@/components/PaymentHistory";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "입금 처리 내역" };

type Raw = {
  id: string;
  total_amount: number;
  depositor_name: string;
  status: "approved" | "rejected";
  reviewed_at: string | null;
  reject_reason: string | null;
  students: { name: string } | null;
  reviewer: { name: string } | null;
  payment_request_items: { fine_id: string }[];
};

export default async function PaymentHistoryPage() {
  const supabase = createClient();

  // reviewed_by 도 students 를 가리키므로 별칭으로 한 번 더 조인한다.
  const { data } = await supabase
    .from("payment_requests")
    .select(
      "id, total_amount, depositor_name, status, reviewed_at, reject_reason, " +
        "students!payment_requests_student_id_fkey(name), " +
        "reviewer:students!payment_requests_reviewed_by_fkey(name), " +
        "payment_request_items(fine_id)"
    )
    .in("status", ["approved", "rejected"])
    .order("reviewed_at", { ascending: false })
    .limit(200);

  const rows: HistoryRow[] = ((data ?? []) as unknown as Raw[]).map((r) => ({
    id: r.id,
    total_amount: r.total_amount,
    depositor_name: r.depositor_name,
    status: r.status,
    reviewed_at: r.reviewed_at,
    reject_reason: r.reject_reason,
    studentName: r.students?.name ?? "?",
    reviewerName: r.reviewer?.name ?? "",
    itemCount: r.payment_request_items?.length ?? 0,
  }));

  return (
    <>
      <PageHeader
        back={{ href: "/admin/payments", label: "입금 확인" }}
        title="입금 처리 내역"
        description="최근 200건까지 보여줘요. 누가 언제 처리했는지 남아 있어요."
      />
      <PaymentHistory rows={rows} />
    </>
  );
}