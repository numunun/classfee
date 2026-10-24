import { createClient } from "@/lib/supabase/server";
import { ReportView, type ReportRow } from "@/components/ReportView";
import { todayISO } from "@/lib/night-study";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "회계 보고서" };

export default async function ReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const supabase = createClient();

  // 기본 기간: 이번 달 1일 ~ 오늘
  const today = todayISO();
  const from = searchParams.from || today.slice(0, 8) + "01";
  const to = searchParams.to || today;

  const { data } = await supabase
    .from("fines")
    .select(
      "id, type, amount, status, reason, occurred_date, overdue_multiplier, students!fines_student_id_fkey(name, student_number)"
    )
    .is("deleted_at", null) // 취소된 건은 제외
    .gte("occurred_date", from)
    .lte("occurred_date", to)
    .order("occurred_date", { ascending: true });

  const rows = (data ?? []) as unknown as ReportRow[];

  const { data: metaData } = await supabase.rpc("board_meta");
  const classLabel = (Array.isArray(metaData) && metaData[0]?.class_label) || "학급";

  return (
    <>
      <div className="no-print">
        <PageHeader
          back={{ href: "/admin", label: "대시보드" }}
          title="회계 보고서"
          description="기간을 고르고 「PDF로 저장」을 누르면 인쇄 창이 열려요. 대상을 「PDF로 저장」으로 바꾸면 파일로 남길 수 있어요."
        />
      </div>

      <ReportView rows={rows} from={from} to={to} classLabel={classLabel} />
    </>
  );
}