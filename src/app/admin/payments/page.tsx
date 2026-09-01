import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { ApprovalButtons } from "@/components/PaymentApproval";
import { FINE_TYPE_LABEL, payable, won, type FineStatus, type FineType } from "@/lib/types";

type Req = {
  id: string;
  total_amount: number;
  depositor_name: string;
  receipt_photo_url: string | null;
  students: { name: string } | null;
  payment_request_items: {
    fines: {
      type: FineType;
      amount: number;
      status: FineStatus;
      reason: string | null;
      created_at: string;
    } | null;
  }[];
};

export default async function PaymentsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("payment_requests")
    .select(
      "id, total_amount, depositor_name, receipt_photo_url, students!payment_requests_student_id_fkey(name), payment_request_items(fines(type, amount, status, reason, created_at))"
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  const reqs = (data ?? []) as unknown as Req[];

  // 영수증 서명 URL 생성
  const signed: Record<string, string> = {};
  for (const r of reqs) {
    if (r.receipt_photo_url) {
      const { data: s } = await supabase.storage
        .from("receipts")
        .createSignedUrl(r.receipt_photo_url, 3600);
      if (s?.signedUrl) signed[r.id] = s.signedUrl;
    }
  }



  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
      <div className="mb-4 mt-2 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">📷 입금 승인 대기</h1>
        <Link
          href="/admin/payments/history"
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-neutral-300"
        >
          처리 내역 →
        </Link>
      </div>

      {reqs.length === 0 && (
        <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-neutral-500">
          대기 중인 입금 신청이 없어요.
        </p>
      )}

      <div className="space-y-3">
        {reqs.map((r) => {
          const studentName = r.students?.name ?? "?";
          const mismatch = r.depositor_name.trim() !== studentName.trim();
          return (
            <div key={r.id} className="rounded-2xl bg-surface p-4">
              <div className="flex items-center gap-3">
                <Avatar name={studentName} />
                <div className="flex-1">
                  <p className="font-medium">{studentName}</p>
                  <p className="text-xs text-neutral-500">
                    {r.payment_request_items
                      .map((it) => (it.fines ? FINE_TYPE_LABEL[it.fines.type] : ""))
                      .filter(Boolean)
                      .join(", ")}{" "}
                    · {won(r.total_amount)}
                  </p>
                </div>
                <span className="rounded-md border border-amber-900/60 bg-amber-950 px-2 py-0.5 text-xs text-amber-400">
                  대기 중
                </span>
              </div>

              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-neutral-400">
                {r.payment_request_items.map((it, i) =>
                  it.fines ? (
                    <li key={i} className="flex flex-col gap-0.5 py-1">
                      <div className="flex justify-between">
                        <span>
                          {FINE_TYPE_LABEL[it.fines.type]}
                          {it.fines.reason ? ` · ${it.fines.reason}` : ""}
                        </span>
                        <span>
                          {won(payable(it.fines))}
                          {it.fines.status === "doubled" && (
                            <span className="ml-1 text-xs text-red-400">(2배)</span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        등록: {new Date(it.fines.created_at).toLocaleString("ko-KR", {
                          year: "numeric", month: "2-digit", day: "2-digit",
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })}
                      </span>
                    </li>
                  ) : null
                )}
              </ul>

              {signed[r.id] && (
                <a href={signed[r.id]} target="_blank" rel="noreferrer" className="mt-3 block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signed[r.id]} alt="입금 영수증" className="max-h-56 rounded-xl border border-line" />
                </a>
              )}

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <div>
                  <p className="text-xs text-neutral-500">학생이 신고한 입금자명</p>
                  <p className={`text-sm ${mismatch ? "text-amber-400" : ""}`}>{r.depositor_name}</p>
                </div>
                <ApprovalButtons requestId={r.id} />
              </div>

              {mismatch && (
                <p className="mt-2 text-xs text-amber-400/80">
                  ⚠ 입금자명이 본인 이름과 달라요. 실제 통장 내역과 대조 후 승인하세요.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
