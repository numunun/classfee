import type { Theme } from "@/lib/themes";

/**
 * 커스텀 테마 사용자의 개인 배너.
 * 글자색은 인라인 style 로 지정한다 — 밝은 테마의 클래스 오버라이드에 걸리지 않도록.
 * 이름과 상단 띠의 흐르는 그라디언트는 themeCss() 가 심는 .tm-name / .tm-stripe 가 담당한다.
 */
export function ThemeBanner({
  theme,
  name,
  studentNumber,
}: {
  theme: Theme;
  name: string;
  studentNumber: number | null;
}) {
  const light = theme.mode === "light";

  return (
    <section
      className="overflow-hidden rounded-2xl"
      style={{
        border: `1px solid ${theme.accent}`,
        boxShadow: light ? `0 10px 30px ${theme.accent}33` : `0 10px 30px rgba(0,0,0,.5)`,
      }}
    >

      <div
        className="relative flex items-center gap-4 px-5 py-4"
        style={{
          background: `linear-gradient(105deg, ${theme.deep} 0%, ${theme.deep}f2 45%, ${theme.accent} 165%)`,
          boxShadow: `inset 0 -3px 0 ${theme.accent}`,
        }}
      >
        {theme.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={theme.logo}
            alt=""
            className="size-14 shrink-0 rounded-xl object-contain"
            style={{ background: "#fff", padding: 4 }}
          />
        ) : (
          <span className="text-4xl leading-none">{theme.emoji}</span>
        )}

        <div className="min-w-0 flex-1">
          {/* 이름에 그라디언트가 흐른다 */}
          <p className="tm-name text-2xl">{name}</p>
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
            {studentNumber ?? ""} · {theme.team}
          </p>
        </div>

        <span
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-extrabold"
          style={{
            background: "#fff",
            color: theme.accent,
            boxShadow: `0 2px 10px rgba(0,0,0,.25)`,
          }}
        >
          {theme.tagline}
        </span>
      </div>

      {/* 하단 모토 띠 — 여기에 그라디언트가 흐른다 */}
      <div
        className="tm-motto px-5 py-2 text-center text-[0.65rem] font-extrabold uppercase tracking-[0.22em]"
        style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.55)" }}
      >
        {theme.motto}
      </div>
    </section>
  );
}