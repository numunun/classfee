import type { FineStatus } from "@/lib/types";

const STYLE: Record<FineStatus, string> = {
  unpaid: "bg-red-950 text-red-400 border-red-900/60",
  doubled: "bg-red-950 text-red-400 border-red-900/60",
  pending_approval: "bg-amber-950 text-amber-400 border-amber-900/60",
  paid: "bg-green-950 text-green-400 border-green-900/60",
};
const TEXT: Record<FineStatus, string> = {
  unpaid: "미납",
  doubled: "미납·2배",
  pending_approval: "승인 대기",
  paid: "완납",
};

export function StatusBadge({ status }: { status: FineStatus }) {
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {TEXT[status]}
    </span>
  );
}
