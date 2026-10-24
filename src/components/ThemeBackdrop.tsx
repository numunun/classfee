import type { Theme } from "@/lib/themes";

/**
 * 테마 사용자 화면 바탕에 아주 옅게 깔리는 팀 색.
 * 로고 워터마크는 쓰지 않는다 — 팀 정체성은 멤버십 카드가 맡고, 나머지 화면은 깔끔하게 둔다.
 * 화면에 고정(fixed)되어 스크롤해도 따라오고, 클릭은 통과시킨다.
 */
export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const light = theme.mode === "light";

  return (
    <div
      aria-hidden
      className="no-print pointer-events-none fixed inset-0 z-0"
      style={{
        background: light
          ? `radial-gradient(900px 480px at 85% -10%, ${theme.accent}1f, transparent 65%)`
          : `radial-gradient(900px 480px at 85% -10%, ${theme.accent}26, transparent 65%),
             radial-gradient(800px 420px at 0% 110%, ${theme.deep}99, transparent 70%)`,
      }}
    />
  );
}
