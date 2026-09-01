/**
 * 개인 커스텀 테마.
 * 학번을 키로 두어 필요한 사람만 등록한다. 없으면 기본(어두운) 화면 그대로.
 */
export type Palette = {
  /** 페이지 배경 */
  ink: string;
  /** 카드 배경 */
  surface: string;
  /** 입력칸·보조 배경 */
  surface2: string;
  /** 테두리 */
  line: string;
};

export type Theme = {
  /** 배너에 크게 뜨는 문구 */
  team: string;
  /** 작게 붙는 한 줄 */
  tagline: string;
  /** 강조색 (글로우, 포커스 테두리) */
  accent: string;
  /** 배너 그라디언트의 짙은 쪽 */
  deep: string;
  /** 배너 이모지 (로고 파일이 없을 때 대체) */
  emoji: string;
  /** 배너 아래 띠에 들어갈 문구 */
  motto: string;
  /** public/ 아래 로고 파일 경로. 없으면 이모지만 */
  logo?: string;
  /** 워터마크 가로 크기. 기본 min(88vw,620px) */
  watermarkSize?: string;
  /** 워터마크를 화면 중앙에서 아래로 얼마나 내릴지. 기본 10vh */
  watermarkShift?: string;
  /** 밝은 배경이면 "light". 글자색을 통째로 반전시킨다. */
  mode?: "dark" | "light";
  /** 이름/띠 그라디언트에 순환시킬 색. 순서대로 흐른다. */
  ramp: string[];
  /** 페이지 전체 색. 생략하면 기본값 유지 */
  palette?: Palette;
};

export const THEMES: Record<number, Theme> = {
  // 황성재 — 한화 이글스 (주황빛 도는 밝은 테마)
  20935: {
    team: "Hanwha Eagles",
    tagline: "최강한화",
    accent: "#E8440A",
    deep: "#0B1B2B",
    emoji: "🦅",
    motto: "DAEJEON · HANWHA EAGLES · 1986 · 최강한화",
    logo: "/theme/hanwha.png",
    ramp: ["#0B1B2B", "#8A2600", "#FC4E00", "#FF9A4D", "#FFE3CC", "#FF8A3D", "#E03F00", "#3A1200"],
    mode: "light",
    watermarkSize: "min(80vw, 560px)",
    watermarkShift: "-1vh",
    palette: {
      ink: "#F3E2D5",      // 따뜻한 모래빛. 흰색이 아니라 확실히 색이 보인다
      surface: "#FFFBF7",  // 카드는 배경보다 밝게 띄운다
      surface2: "#F6E5D8",
      line: "#E3C4AC",
    },
  },
    // 20911 — Gen.G
  20911: {
    team: "Gen.G Esports",
    tagline: "GEN.G",
    accent: "#CFB887",
    deep: "#0B0B0D",
    emoji: "🏆",
    motto: "GEN.G Valorant · SEOUL · 2020 · TIGERNATION",
    logo: "/theme/gen.svg",
    ramp: ["#3D3320", "#8A7846", "#CFB887", "#F0E4C8", "#FFFFFF", "#CFB887", "#5C4E2E"],
    mode: "dark",
    watermarkSize: "min(78vw, 560px)",
    watermarkShift: "-1vh",
    palette: {
      ink: "#0A0A0B",
      surface: "#161614",
      surface2: "#201F1B",
      line: "#332F26",
    },
  },
    // 20926 — T1
  20926: {
    team: "T1",
    tagline: "T1",
    accent: "#E2012D",
    deep: "#0A0A0C",
    emoji: "🔴",
    motto: "T1 · SEOUL · 2004 · A flower blooming against all odds.",
    logo: "/theme/t1.png",
    ramp: ["#3A0009", "#9E0020", "#E2012D", "#FF3E60", "#FFD5DD", "#E2012D", "#7A0018"],
    mode: "dark",
    watermarkSize: "min(82vw, 600px)",
    watermarkShift: "-1vh",
    palette: {
      ink: "#08080A",
      surface: "#141417",
      surface2: "#1D1D21",
      line: "#2E2E34",
    },
  },
};

export function getTheme(studentNumber: number | null | undefined): Theme | null {
  if (studentNumber == null) return null;
  return THEMES[studentNumber] ?? null;
}

/** "#FC4E00" -> "252 78 0" (Tailwind 의 rgb(var(--x) / alpha) 형식용) */
function rgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * 앱이 어두운 배경 전제로 만들어져 글자색이 컴포넌트마다 박혀 있다.
 * 밝은 테마에서는 그 유틸리티 클래스들을 한 번에 뒤집어준다.
 * (이 style 은 테마가 있는 사용자 페이지에만 삽입되므로 다른 사람에겐 영향이 없다)
 */
const LIGHT_OVERRIDES = `
.text-white{color:#1B1B1F !important;}
.text-neutral-100{color:#1B1B1F !important;}
.text-neutral-200{color:#2A2A30 !important;}
.text-neutral-300{color:#3A3A42 !important;}
.text-neutral-400{color:#5C5C66 !important;}
.text-neutral-500{color:#77717A !important;}
.text-neutral-600{color:#8C8691 !important;}
.text-neutral-700{color:#A09AA5 !important;}
body{color:#1B1B1F;}
label{color:#5C5C66;}
input,select,textarea{color:#1B1B1F;}
/* 흰 버튼은 밝은 배경에서 안 보이므로 강조색으로 */
.bg-white{background-color:rgb(var(--c-accent)) !important;}
.bg-white.text-neutral-900,.bg-white .text-neutral-900{color:#fff !important;}
.text-neutral-900{color:#fff !important;}
/* 어두운 배경 전제의 상태 배지들을 밝게 */
.bg-red-950\\/40,.bg-red-950{background-color:#FDECEC !important;}
.bg-amber-950\\/40,.bg-amber-950,.bg-amber-950\\/30{background-color:#FDF3E2 !important;}
.bg-green-950{background-color:#E9F7EE !important;}
.bg-blue-950\\/25{background-color:#EDF3FD !important;}
.bg-blue-900\\/60{background-color:#DCE8FB !important;}
.text-red-300,.text-red-400,.text-red-400\\/80{color:#C0392B !important;}
.text-amber-300,.text-amber-400,.text-amber-400\\/70,.text-amber-400\\/80{color:#B26B00 !important;}
.text-green-300,.text-green-400{color:#1E7A46 !important;}
.text-blue-200,.text-blue-300{color:#1F4FA8 !important;}
`;

/**
 * 이름·모토 띠·워터마크 애니메이션.
 * 그라디언트가 한 바퀴 돌 때 끊겨 보이지 않도록 색 배열 끝에 첫 색을 다시 붙인다.
 * (마지막 색과 첫 색이 다르면 반복 지점에서 색이 뚝 끊긴다)
 */
function motionCss(theme: Theme): string {
  const loop = [...theme.ramp, theme.ramp[0]].join(",");

  return `
@keyframes tm-sweep{from{background-position:0% 50%}to{background-position:300% 50%}}
@keyframes tm-glow{
  from{filter:drop-shadow(0 0 2px rgba(255,255,255,.7)) drop-shadow(0 0 6px ${theme.accent}66)}
  to{filter:drop-shadow(0 0 3px rgba(255,255,255,.95)) drop-shadow(0 0 12px ${theme.accent}aa)}
}
@keyframes tm-breathe{from{opacity:.13;transform:scale(.98)}to{opacity:.2;transform:scale(1.02)}}

.tm-name{
  display:inline-block;
  font-weight:900;
  letter-spacing:.01em;
  color:transparent;
  background:linear-gradient(100deg,${loop});
  background-size:300% 100%;
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  animation:tm-sweep 4.5s linear infinite, tm-glow 2.2s ease-in-out infinite alternate;
}

.tm-motto{
  background:linear-gradient(100deg,${loop});
  background-size:300% 100%;
  animation:tm-sweep 6s linear infinite;
}

.tm-watermark{animation:tm-breathe 3.6s ease-in-out infinite alternate;}

@media (prefers-reduced-motion: reduce){
  .tm-name,.tm-motto,.tm-watermark{animation:none !important;}
}
`;
}

/**
 * 카드·버튼을 반투명 + 흐림(유리 질감)으로 만든다.
 * 뒤 워터마크가 비치되 흐려져서 글자 가독성이 유지되고, 테두리로 경계가 분명해진다.
 * border 대신 box-shadow 로 선을 그려 기존 테두리 색과 충돌하지 않게 한다.
 */
const GLASS = `
.bg-surface{
  background-color:rgb(var(--c-surface)/.25) !important;
  -webkit-backdrop-filter:blur(18px) saturate(1.4);
  backdrop-filter:blur(18px) saturate(1.4);
  box-shadow:0 0 0 1px rgb(var(--c-line)), 0 6px 20px rgba(0,0,0,.06);
}
.bg-surface-2{
  background-color:rgb(var(--c-surface-2)/.5) !important;
  -webkit-backdrop-filter:blur(14px) saturate(1.3);
  backdrop-filter:blur(14px) saturate(1.3);
  box-shadow:0 0 0 1px rgb(var(--c-line));
}
/* 버튼은 눌리는 요소이므로 경계를 조금 더 또렷하게 */
button.bg-surface-2,a.bg-surface-2{
  box-shadow:0 0 0 1px rgb(var(--c-line)), 0 8px 26px rgba(0,0,0,.10);
}
`;

/** 테마가 없을 때 되돌릴 기본값. globals.css 의 :root 와 같아야 한다. */
const DEFAULT_ROOT =
  ":root{color-scheme:dark;" +
  "--c-ink:14 14 16;--c-surface:22 22 24;--c-surface-2:31 31 35;" +
  "--c-line:42 42 46;--c-accent:59 130 246;}";

/**
 * :root 에 넣을 CSS 문자열.
 * 테마가 없으면 빈 문자열이 아니라 "기본값"을 돌려준다.
 * 빈 문자열을 주면 앞 화면(관리자 본인 테마)의 값이 남아 미리보기가 오염된다.
 */
export function themeCss(theme: Theme | null): string {
  if (!theme) return DEFAULT_ROOT;

  const vars = [`--c-accent:${rgbTriplet(theme.accent)};`];
  if (theme.palette) {
    vars.push(
      `--c-ink:${rgbTriplet(theme.palette.ink)};`,
      `--c-surface:${rgbTriplet(theme.palette.surface)};`,
      `--c-surface-2:${rgbTriplet(theme.palette.surface2)};`,
      `--c-line:${rgbTriplet(theme.palette.line)};`
    );
  }
  const root = `:root{color-scheme:${theme.mode === "light" ? "light" : "dark"};${vars.join("")}}`;
  const base = theme.mode === "light" ? root + LIGHT_OVERRIDES : root;
  return base + GLASS + motionCss(theme);
}