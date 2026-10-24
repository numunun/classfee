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
  /** 카드 위쪽에 작게 들어가는 팀·소속 이름 */
  team: string;
  /** 이름 옆에 붙는 한 줄 */
  tagline: string;
  /** 강조색 (버튼, 포커스 테두리, 카드 아래 띠) */
  accent: string;
  /** 멤버십 카드 바탕색 */
  deep: string;
  /** 로고 파일이 없을 때 대신 쓸 이모지 */
  emoji: string;
  /** 카드 맨 아래 작은 글씨 */
  motto: string;
  /**
   * 본인 화면에서만 이름 대신 보여줄 별명.
   * 벌금 목록·전자칠판·관리 화면 등 남에게 보이는 곳은 실명 그대로 쓴다.
   */
  nickname?: string;
  /** public/ 아래 로고 파일 경로. 없으면 이모지만 */
  logo?: string;
  /** 밝은 배경이면 "light". 글자색을 통째로 반전시킨다. */
  mode?: "dark" | "light";
  /** 카드를 기울일 때 스치는 빛에 섞을 팀 색들 */
  ramp: string[];
  /** 페이지 전체 색. 생략하면 기본값 유지 */
  palette?: Palette;
  /** 카드 오른쪽에 깔리는 그림 (인물 사진·엠블럼). 왼쪽으로 갈수록 흐려진다 */
  cardImage?: string;
  /**
   * 그림을 카드 어디에 맞출지.
   *  - "bottom"(기본): 아래에 붙인다. 허리 아래까지 나온 전신 사진용
   *  - "top": 위에 붙여 머리가 잘리지 않게 하고, 오른쪽 위 로고 칸을 비켜 둔다. 상반신 사진용
   */
  cardImageAlign?: "bottom" | "top";
};

export const THEMES: Record<number, Theme> = {
  // 황성재 — 한화 이글스. 흰 바탕 + 한화 오렌지 + 검은 카드, 세 가지 색만 쓴다.
  // 예전 모래빛 바탕은 베이지인지 분홍인지 애매하고, 남색 카드에 주황이 섞이면 갈색으로 탁해졌다.
  20935: {
    team: "Hanwha Eagles",
    tagline: "최강한화",
    accent: "#F25F00",     // 한화 오렌지. 흰 글자가 읽히도록 공식색(#FF6600)보다 한 톤 진하게
    deep: "#141414",       // 카드는 검정. 주황이 섞여도 탁해지지 않는다
    emoji: "🦅",
    motto: "DAEJEON · HANWHA EAGLES · 1986 · 최강한화",
    logo: "/theme/hanwha.png",
    cardImage: "/theme/moon-dongju.webp",
    cardImageAlign: "top",
    ramp: ["#F25F00", "#FF8A33", "#FFFFFF", "#FF6600"],
    mode: "light",
    palette: {
      ink: "#F4F2EF",      // 거의 흰색에 아주 살짝 따뜻한 회색
      surface: "#FFFFFF",
      surface2: "#F2EEEA",
      line: "#E6E0DA",
    },
  },
  // 20904
  20904: {
    team: "노사모",
    tagline: "노사모",
    accent: "#F5A623",
    deep: "#2B2118",
    emoji: "🌻",
    motto: "OWL ROCK · GIMHAE · 2009 · 0523",
    // 엠블럼은 로고 칸에, 인물 사진은 카드 오른쪽 그림으로
    logo: "/theme/backdrop-20904.png",
    cardImage: "/theme/banner-20904.png",
    ramp: ["#3A2A14", "#8A6A20", "#F5A623", "#FFE0A0", "#FFFFFF", "#F5A623", "#5A4318"],
    mode: "dark",
    palette: {
      ink: "#0B0A08",
      surface: "#17150F",
      surface2: "#201D15",
      line: "#332E22",
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
    palette: {
      ink: "#0A0A0B",
      surface: "#161614",
      surface2: "#201F1B",
      line: "#332F26",
    },
  },
  // 20915 — 치지직
  20915: {
    team: "CHZZK",
    tagline: "ON AIR",
    accent: "#00FFA3",
    deep: "#0B0F0D",
    emoji: "🎙",
    motto: "CHZZK · STREAMING · 지금 방송 중",
    logo: "/theme/chzzk.svg",
    nickname: "쿠 네",
    ramp: ["#04301F", "#00A86B", "#00FFA3", "#B9FFE2", "#FFFFFF", "#00FFA3", "#036B45"],
    mode: "dark",
    palette: {
      ink: "#080A09",
      surface: "#121614",
      surface2: "#1A211D",
      line: "#26332C",
    },
  },
  // 20927 — UFC
  20925: {
    team: "PADDY PIMBLETT",
    tagline: "UFC",
    accent: "#D20A0A",
    deep: "#0A0A0A",
    emoji: "🥊",
    motto: "TOPURIA SAUSAGE · LIGHTWEIGHT · UFC · 28-6",
    logo: "/theme/ufc.svg",
    cardImage: "/theme/paddy.png",
    ramp: ["#2A0505", "#8A0A0A", "#D20A0A", "#FF5252", "#FFFFFF", "#D20A0A", "#4A0808"],
    mode: "dark",
    palette: {
      ink: "#070707",
      surface: "#141414",
      surface2: "#1C1C1C",
      line: "#2E2E2E",
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
    logo: "/theme/T1.png",
    ramp: ["#3A0009", "#9E0020", "#E2012D", "#FF3E60", "#FFD5DD", "#E2012D", "#7A0018"],
    mode: "dark",
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
 * 멤버십 카드의 빛 효과.
 *  - tm-holo: 팀 색이 섞인 홀로그램 띠. 카드를 기울이거나 손가락·마우스를 올리면
 *    MembershipCard 가 넣는 --mx/--my 를 따라 움직인다.
 *  - tm-glint: 가만히 있어도 몇 초에 한 번 흰 빛이 카드 위를 스친다.
 * 움직임 줄이기 설정이면 둘 다 멈춘다.
 */
function cardCss(theme: Theme): string {
  const holo = theme.ramp.map((c) => `${c}55`).join(",");
  return `
@keyframes tm-glint{0%,72%{transform:translateX(-130%)}100%{transform:translateX(130%)}}
.tm-holo{
  background:linear-gradient(115deg,transparent 18%,${holo},transparent 82%);
  background-size:260% 260%;
  background-position:calc(var(--mx,.5)*100%) calc(var(--my,.5)*100%);
  mix-blend-mode:screen;
  opacity:.28;
  transition:background-position .25s ease-out;
}
.tm-glint{
  background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.18) 50%,transparent 62%);
  animation:tm-glint 7s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce){
  .tm-glint{animation:none;opacity:0;}
  .tm-holo{transition:none;}
}
`;
}

/**
 * 카드·버튼 바탕.
 * border 대신 box-shadow 로 선을 그려 기존 테두리 색과 충돌하지 않게 한다.
 *
 * 예전에는 배경 워터마크가 비치도록 반투명 + 흐림(유리 질감)이었지만,
 * 워터마크를 없앤 뒤로는 흐릴 대상이 없어 흐림은 쓰지 않는다 (카드마다 GPU 만 쓰고 스크롤이 끊김).
 * 테마 화면은 바탕의 은은한 팀 색이 아주 살짝 비치도록 거의 불투명하게 둔다.
 * 미리보기에서 앞서 들어온 테마 값이 남지 않도록 backdrop-filter:none 을 명시한다.
 */
function glassCss(themed: boolean): string {
  const alpha = themed ? ".92" : "1";
  // 기본 화면은 진한 테두리 대신 아주 옅은 흰 선으로 카드 경계만 살린다
  const ring = themed ? "rgb(var(--c-line))" : "rgb(255 255 255 / .06)";
  return `
.bg-surface{
  background-color:rgb(var(--c-surface)/${alpha}) !important;
  -webkit-backdrop-filter:none;
  backdrop-filter:none;
  box-shadow:0 0 0 1px ${ring}, 0 6px 20px rgba(0,0,0,.06);
}
.bg-surface-2{
  background-color:rgb(var(--c-surface-2)) !important;
  box-shadow:0 0 0 1px ${ring};
}
/* 버튼은 눌리는 요소이므로 경계를 조금 더 또렷하게 */
button.bg-surface-2,a.bg-surface-2{
  box-shadow:0 0 0 1px ${ring}, 0 8px 26px rgba(0,0,0,.10);
}
`;
}

/**
 * 밝은 테마가 남긴 색 반전을 되돌린다.
 * 루트 레이아웃이 넣은 테마 위에 다른 테마(또는 기본)를 덮어쓸 때 필요하다.
 * :root 변수만 되돌리면 !important 로 박힌 클래스 규칙이 그대로 남는다.
 */
const DARK_OVERRIDES = `
.text-white{color:#FFFFFF !important;}
.text-neutral-100{color:#F5F5F5 !important;}
.text-neutral-200{color:#E5E5E5 !important;}
.text-neutral-300{color:#D4D4D4 !important;}
.text-neutral-400{color:#A3A3A3 !important;}
.text-neutral-500{color:#737373 !important;}
.text-neutral-600{color:#525252 !important;}
.text-neutral-700{color:#404040 !important;}
.text-neutral-900{color:#171717 !important;}
body{color:#F5F5F5;}
label{color:#A3A3A3;}
input,select,textarea{color:#F5F5F5;}
.bg-white{background-color:#FFFFFF !important;}
.bg-red-950\\/40{background-color:rgb(69 10 10 / .4) !important;}
.bg-red-950{background-color:rgb(69 10 10) !important;}
.bg-amber-950\\/40{background-color:rgb(69 26 3 / .4) !important;}
.bg-amber-950\\/30{background-color:rgb(69 26 3 / .3) !important;}
.bg-amber-950{background-color:rgb(69 26 3) !important;}
.bg-green-950{background-color:rgb(5 46 22) !important;}
.bg-blue-950\\/25{background-color:rgb(23 37 84 / .25) !important;}
.bg-blue-900\\/60{background-color:rgb(30 58 138 / .6) !important;}
.text-red-300{color:#FCA5A5 !important;}
.text-red-400{color:#F87171 !important;}
.text-red-400\\/80{color:rgb(248 113 113 / .8) !important;}
.text-amber-300{color:#FCD34D !important;}
.text-amber-400{color:#FBBF24 !important;}
.text-amber-400\\/70{color:rgb(251 191 36 / .7) !important;}
.text-amber-400\\/80{color:rgb(251 191 36 / .8) !important;}
.text-green-300{color:#86EFAC !important;}
.text-green-400{color:#4ADE80 !important;}
.text-blue-200{color:#BFDBFE !important;}
.text-blue-300{color:#93C5FD !important;}
`;

/** 테마가 없을 때 되돌릴 기본값. globals.css 의 :root 와 같아야 한다. */
const DEFAULT_ROOT =
  ":root{color-scheme:dark;" +
  "--c-ink:9 9 11;--c-surface:23 23 26;--c-surface-2:33 33 37;" +
  "--c-line:44 44 49;--c-accent:49 130 246;}";

/**
 * :root 에 넣을 CSS 문자열.
 * 테마가 없으면 빈 문자열이 아니라 "기본값"을 돌려준다.
 * 빈 문자열을 주면 앞 화면(관리자 본인 테마)의 값이 남아 미리보기가 오염된다.
 */
export function themeCss(theme: Theme | null): string {
  if (!theme) return DEFAULT_ROOT + DARK_OVERRIDES + glassCss(false);

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
  const base = theme.mode === "light" ? root + LIGHT_OVERRIDES : root + DARK_OVERRIDES;
  return base + glassCss(true) + cardCss(theme);
}