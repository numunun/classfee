import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * 하위 화면 공통 머리.
 * 뒤로 가기 · 제목 · 한 줄 설명 · 오른쪽 버튼을 한 모양으로 맞춘다.
 */
export function PageHeader({
  back,
  title,
  description,
  action,
  className = "",
}: {
  back?: { href: string; label: string };
  /** 본문에 제목이 따로 있으면(약관 등) 생략한다 */
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={`mb-5 ${className}`}>
      {back && (
        <Link
          href={back.href}
          className="-ml-1 inline-flex items-center gap-0.5 rounded-lg py-1 pr-2 text-sm text-neutral-500 transition hover:text-neutral-300"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      {(title || action) && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          {action}
        </div>
      )}
      {description && (
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{description}</p>
      )}
    </header>
  );
}

/** 머리 오른쪽에 붙는 작은 링크 버튼 */
export function HeaderLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="btn btn-sm press shrink-0 bg-surface-2 font-medium text-neutral-200"
    >
      {children}
    </Link>
  );
}
