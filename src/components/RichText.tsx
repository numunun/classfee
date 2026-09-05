import { Fragment } from "react";

/**
 * 공지에서 쓰는 아주 작은 마크다운.
 * **굵게** 와 ~~취소선~~ 만 지원한다.
 * 전체 마크다운 라이브러리를 쓰면 링크·이미지·HTML 까지 열려서
 * 공지 한 줄 꾸미자고 감당할 범위가 아니다.
 */
const PATTERN = /(\*\*[^*\n]+\*\*|~~[^~\n]+~~)/g;

export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(PATTERN);

  return (
    <p className={`whitespace-pre-wrap ${className ?? ""}`}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("~~") && part.endsWith("~~")) {
          return (
            <span key={i} className="line-through opacity-60">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}