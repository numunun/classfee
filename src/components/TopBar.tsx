import Link from "next/link";
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
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-600/90 text-lg">🏫</span>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && here === "student" && (
          <Link
            href="/admin"
            className="rounded-lg bg-blue-900/60 px-2.5 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-900"
          >
            관리
          </Link>
        )}
        {here === "admin" && (
          <Link
            href="/student"
            className="rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-line"
          >
            ← 내 화면
          </Link>
        )}
        <span className="hidden text-sm text-neutral-400 sm:inline">{who}</span>
        <SignOutButton />
      </div>
    </header>
  );
}