import type { Theme } from "@/lib/themes";

/**
 * 페이지 전체에 깔리는 팀 배경.
 * 화면에 고정(fixed)되어 스크롤해도 따라오고, 클릭은 통과시킨다.
 *
 * 위치잡기는 바깥 div, 애니메이션은 안쪽 img 가 맡는다.
 * 한 요소에서 둘 다 하면 애니메이션의 transform 이 정렬을 덮어써서 로고가 밀려난다.
 */
export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const light = theme.mode === "light";
  const size = theme.watermarkSize ?? "min(88vw, 620px)";
  // 화면 정중앙에 두면 상단 헤더·배너 때문에 시각적으로 높아 보인다. 조금 내려서 균형을 맞춘다.
  const shift = theme.watermarkShift ?? "10vh";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 팀 색 번짐 */}
      <div
        className="absolute inset-0"
        style={{
          background: light
            ? `radial-gradient(1100px 560px at 88% -12%, ${theme.accent}1a, transparent 62%),
               radial-gradient(900px 520px at 6% 108%, ${theme.accent}10, transparent 66%)`
            : `radial-gradient(1200px 600px at 85% -10%, ${theme.accent}22, transparent 60%),
               radial-gradient(900px 500px at 10% 105%, ${theme.deep}cc, transparent 65%)`,
        }}
      />

      {/* 로고 워터마크 */}
      {theme.logo && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingTop: `calc(${shift} * 2)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme.logo}
            alt=""
            className="tm-watermark select-none"
            style={{
              width: size,
              opacity: light ? 0.16 : 0.1,
              mixBlendMode: light ? "multiply" : "normal",
            }}
          />
        </div>
      )}

      {/* 어두운 테마에서만 위아래를 눌러 글자 대비를 확보한다. */}
      {!light && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgb(var(--c-ink)/0.5) 0%, transparent 22%, transparent 72%, rgb(var(--c-ink)/0.85) 100%)`,
          }}
        />
      )}
    </div>
  );
}