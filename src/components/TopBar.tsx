import Link from "next/link";
import { School, LayoutDashboard, ChevronLeft } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

export function TopBar({
  title,
  who,
  isAdmin = false,
  here = "student",
}: {
  title: string;
  who: string;
  /** DB role 이 admin 인지 */
  isAdmin?: boolean;
  /** 현재 어느 영역인지 — 반대편으로 가는 버튼을 띄운다 */
  here?: "student" | "admin";
}) {
  return (
    <header className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-center gap-3">
        {/* 아이콘 색은 인라인으로 고정한다. 밝은 테마의 글자색 반전 규칙에 걸리지 않게 */}
        <span
          className="grid size-10 shrink-0 place-items-center rounded-2xl"
          style={{ background: "rgb(var(--c-accent))", color: "#fff" }}
        >
          <School className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          <p className="truncate text-xs text-neutral-500">{who}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isAdmin && here === "student" && (
          <Link href="/admin" className="btn btn-sm press bg-surface-2 text-neutral-200">
            <LayoutDashboard className="size-4" aria-hidden />
            관리
          </Link>
        )}
        {here === "admin" && (
          <Link href="/student" className="btn btn-sm press bg-surface-2 text-neutral-200">
            <ChevronLeft className="-ml-1 size-4" aria-hidden />
            내 화면
          </Link>
        )}
        <SignOutButton />
      </div>
    </header>
  );
}
