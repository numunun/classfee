import type { LucideIcon } from "lucide-react";

/** 카드 머리: 아이콘 칸 + 제목 + (오른쪽) 부가 정보 */
export function CardTitle({
  icon: Icon,
  children,
  right,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="icon-tile">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="truncate font-semibold">{children}</h2>
      </div>
      {right}
    </div>
  );
}
