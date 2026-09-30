import type { Theme } from "@/lib/themes";

/**
 * 페이지 전체에 깔리는 배경.
 * 화면에 고정(fixed)되어 스크롤해도 따라오고, 클릭은 통과시킨다.
 */
export function ThemeBackdrop({ theme }: { theme: Theme }) {
  const light = theme.mode === "light";
  const size = theme.watermarkSize ?? "min(88vw, 620px)";
  const shift = theme.watermarkShift ?? "10vh";

  // 배경 전용 이미지가 있으면 그것을, 없으면 로고를 쓴다
  const image = theme.backdropImage ?? theme.logo;

  // 인물 사진은 로고보다 존재감이 커서 기본값보다 훨씬 옅게 깔아야 한다
  const opacity = theme.backdropOpacity ?? (light ? 0.07 : 0.05);

  const align =
    theme.backdropPosition === "right"
      ? "justify-end pr-[2vw]"
      : theme.backdropPosition === "left"
      ? "justify-start pl-[2vw]"
      : "justify-center";

  return (
    <div aria-hidden className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 테마 색 번짐 */}
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

      {/* 배경 이미지 */}
      {image && (
        <div
          className={`absolute inset-0 flex items-center ${align}`}
          style={{ paddingTop: `calc(${shift} * 2)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            // 로고는 은은하게 숨쉬지만, 인물 사진이 커졌다 작아지면 어색하다
            className={`${theme.backdropImage ? "" : "tm-watermark"} select-none`}
            style={{
              width: size,
              opacity,
              mixBlendMode: light ? "multiply" : "normal",
            }}
          />
        </div>
      )}

      {/* 어두운 테마에서만 위아래를 눌러 글자 대비를 확보한다 */}
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