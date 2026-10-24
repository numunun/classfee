import type { FineStatus } from "@/lib/types";

// 배경은 반투명 틴트라 어두운·밝은 테마 모두에서 그대로 쓸 수 있다.
// 글자색(text-*-400)은 밝은 테마에서 themes.ts 가 진한 색으로 바꿔준다.
const STYLE: Record<FineStatus, string> = {
  unpaid: "bg-red-500/15 text-red-400",
  doubled: "bg-red-500/15 text-red-400",
  pending_approval: "bg-amber-500/15 text-amber-400",
  paid: "bg-green-500/15 text-green-400",
};
const TEXT: Record<FineStatus, string> = {
  unpaid: "미납",
  doubled: "2배",
  pending_approval: "승인 대기",
  paid: "완납",
};

export function StatusBadge({ status }: { status: FineStatus }) {
  return <span className={`pill ${STYLE[status]}`}>{TEXT[status]}</span>;
}
