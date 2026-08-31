import { createClient } from "@supabase/supabase-js";
import {
  NS_LABEL,
  SESSIONS,
  SESSION_LABEL,
  liveSessionAt,
  seoulMinutesOfDay,
  type NightStatus,
  type Session,
} from "@/lib/night-study";

export const dynamic = "force-dynamic";

/**
 * 구형 브라우저(전자칠판)용 현황판.
 * React 런타임 / Tailwind 를 거치지 않고 서버에서 만든 HTML 만 내려보낸다.
 * 대상은 Opera 51 = Chromium 64 이므로
 * clamp() / gap / dvh / 공백구분 rgb() 만 피하면 대부분의 CSS 는 쓸 수 있다.
 */

type Snap = {
  seat_no: number;
  name: string;
  status: NightStatus;
  reason: string | null;
  is_independent: boolean;
};

const COLS = 7;
const MIN_SEATS = 35;

// 자동 갱신 주기(초). 자바스크립트를 못 쓰는 브라우저라 meta refresh 로만 갱신한다.
const REFRESH_SEC = 15;

// [카드배경, 강조색, 테두리, 배지배경]
const COLOR: Record<NightStatus, [string, string, string, string]> = {
  present:     ["rgba(16,64,38,0.55)",  "#6ee7a8", "rgba(52,168,110,0.45)", "rgba(52,168,110,0.18)"],
  independent: ["rgba(12,60,54,0.55)",  "#5eead4", "rgba(45,168,152,0.45)", "rgba(45,168,152,0.18)"],
  academy:     ["rgba(66,50,10,0.55)",  "#fbbf5e", "rgba(190,140,40,0.45)", "rgba(190,140,40,0.18)"],
  hospital:    ["rgba(66,20,28,0.55)",  "#fb8ca0", "rgba(200,70,95,0.45)",  "rgba(200,70,95,0.18)"],
  special:     ["rgba(44,28,72,0.55)",  "#c4a2fb", "rgba(140,95,220,0.45)", "rgba(140,95,220,0.18)"],
  other:       ["rgba(38,38,44,0.6)",   "#cfcfd6", "rgba(120,120,132,0.4)", "rgba(120,120,132,0.16)"],
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dateLine(): string {
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(new Date());
}

export async function GET(
  request: Request,
  { params }: { params: { grade: string; classNo: string } }
) {
  const url = new URL(request.url);
  const grade = Number(params.grade);
  const classNo = Number(params.classNo);
  const code = url.searchParams.get("k") || "";

  const asked = Number(url.searchParams.get("s"));
  const explicit = (SESSIONS as readonly number[]).includes(asked) ? (asked as Session) : null;
  const session: Session = explicit ?? liveSessionAt(seoulMinutesOfDay()) ?? 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const [{ data, error }, { data: meta }] = await Promise.all([
    supabase.rpc("board_snapshot", {
      p_grade: grade,
      p_class: classNo,
      p_session: session,
      p_code: code,
    }),
    supabase.rpc("board_meta"),
  ]);

  const refreshTarget =
    "?" + (explicit ? "s=" + explicit + "&" : "") + (code ? "k=" + encodeURIComponent(code) : "");

  const head =
    "<!DOCTYPE html>" +
    '<html lang="ko"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta http-equiv="refresh" content="' + REFRESH_SEC + ';url=' + esc(refreshTarget) + '">' +
    "<title>CIP 현황판</title>" +
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">' +
    "<style>" +
    // Chromium 64(Opera 51) 기준. clamp()/gap/dvh/공백구분 rgb() 는 피하고
    // grid-gap, rgba(), 그라디언트, 그림자, 트랜지션은 모두 지원되므로 활용한다.
    "*{box-sizing:border-box;margin:0;padding:0;}" +
    "html,body{height:100%;overflow:hidden;background:#07070a;color:#e9e9ee;" +
    "font-family:Pretendard,'Malgun Gothic','Apple SD Gothic Neo',sans-serif;" +
    "-webkit-font-smoothing:antialiased;}" +
    "body{background-image:radial-gradient(circle at 15% -10%,rgba(46,120,200,0.16),transparent 55%)," +
    "radial-gradient(circle at 90% 0%,rgba(120,60,190,0.13),transparent 50%);}" +
    ".wrap{height:100%;padding:2.2vh 2vw;display:-webkit-box;display:flex;" +
    "-webkit-box-orient:vertical;flex-direction:column;}" +

    ".top{display:flex;align-items:flex-end;justify-content:space-between;}" +
    ".ttl{font-size:3.4vh;font-weight:800;letter-spacing:-0.02em;color:#fff;line-height:1.05;}" +
    ".sub{margin-top:0.5vh;font-size:1.6vh;color:#8a8a96;letter-spacing:0.01em;}" +
    ".rt{text-align:right;}" +

    ".tabs{white-space:nowrap;}" +
    ".tab{display:inline-block;padding:0.7vh 1.8vh;margin-left:0.6vh;font-size:1.7vh;font-weight:700;" +
    "border-radius:999px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.03);" +
    "color:#6f6f7c;text-decoration:none;transition:all .18s ease;}" +
    ".tab-on{background:#fff;border-color:#fff;color:#0b0b0f;" +
    "box-shadow:0 0.4vh 1.6vh rgba(255,255,255,0.18);}" +
    ".tab-live{border-color:rgba(52,168,110,0.6);color:#6ee7a8;background:rgba(52,168,110,0.1);}" +
    ".dot{display:inline-block;width:0.8vh;height:0.8vh;margin-left:0.6vh;border-radius:50%;" +
    "background:#34d17e;vertical-align:middle;}" +

    ".sum{margin-top:1.2vh;white-space:nowrap;}" +
    ".chip{display:inline-block;margin-right:0.8vh;padding:0.5vh 1.4vh;border-radius:999px;" +
    "font-size:1.5vh;font-weight:700;border:1px solid;}" +

    ".grid{margin-top:1.6vh;display:-ms-grid;display:grid;" +
    "grid-template-columns:repeat(7,1fr);grid-gap:1vh;-webkit-box-flex:1;flex:1;min-height:0;}" +
    ".cell{border-radius:1.4vh;border:1px solid;padding:1vh 0.6vh;text-align:center;" +
    "display:-webkit-box;display:flex;-webkit-box-orient:vertical;flex-direction:column;" +
    "-webkit-box-pack:center;justify-content:center;overflow:hidden;" +
    "box-shadow:0 0.3vh 1.2vh rgba(0,0,0,0.35);}" +
    ".no{font-size:1.25vh;font-weight:600;color:rgba(255,255,255,0.35);letter-spacing:0.06em;}" +
    ".nm{margin-top:0.4vh;font-size:2.6vh;font-weight:800;color:#fff;letter-spacing:-0.02em;" +
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
    ".st{margin-top:0.7vh;display:inline-block;padding:0.3vh 1.1vh;border-radius:999px;" +
    "font-size:1.45vh;font-weight:700;}" +
    ".rs{margin-top:0.5vh;font-size:1.2vh;color:rgba(255,255,255,0.45);" +
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
    ".empty{border:1px dashed rgba(255,255,255,0.06);border-radius:1.4vh;" +
    "display:-webkit-box;display:flex;-webkit-box-pack:center;justify-content:center;" +
    "-webkit-box-align:center;align-items:center;}" +
    ".empty .no{color:rgba(255,255,255,0.14);}" +
    "html{background:#07070a;}" +

    "</style></head><body><div class=\"wrap\">";

  if (error) {
    const body =
      '<div class="ttl" style="color:#fb8ca0">현황판을 열 수 없습니다</div>' +
      '<div class="sub">' + esc(error.message) + "</div>";
    return new Response(head + body + "</div></body></html>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const rows = (data ?? []) as Snap[];
  const bySeat: Record<number, Snap> = {};
  let maxSeat = MIN_SEATS;
  for (const r of rows) {
    bySeat[r.seat_no] = r;
    if (r.seat_no > maxSeat) maxSeat = r.seat_no;
  }
  // 7열 격자를 가득 채우도록 마지막 줄까지 칸을 만든다
  const cellCount = Math.ceil(maxSeat / COLS) * COLS;

  const label =
    (Array.isArray(meta) && meta[0] && meta[0].class_label) || grade + "학년 " + classNo + "반";

  const live = liveSessionAt(seoulMinutesOfDay());

  // 차수 탭
  let tabs = "";
  for (const n of SESSIONS) {
    let cls = "tab";
    if (n === session) cls += " tab-on";
    else if (n === live) cls += " tab-live";
    const href = "?s=" + n + (code ? "&k=" + encodeURIComponent(code) : "");
    tabs +=
      '<a class="' + cls + '" href="' + esc(href) + '">' +
      SESSION_LABEL[n] +
      (n === live ? '<span class="dot"></span>' : "") +
      "</a>";
  }

  // 상태별 인원 칩
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  const order: NightStatus[] = ["present", "independent", "academy", "hospital", "special", "other"];
  let chips = "";
  for (const k of order) {
    if (!counts[k]) continue;
    const c = COLOR[k];
    chips +=
      '<span class="chip" style="background:' + c[3] + ";border-color:" + c[2] + ";color:" + c[1] + '">' +
      NS_LABEL[k] + " " + counts[k] +
      "</span>";
  }

  // 좌석 카드
  let cells = "";
  for (let n = 1; n <= cellCount; n++) {
    const r = bySeat[n];
    if (!r) {
      cells += '<div class="empty"><span class="no">' + n + "</span></div>";
      continue;
    }
    const c = COLOR[r.status] || COLOR.other;
    cells +=
      '<div class="cell" style="background:' + c[0] + ";border-color:" + c[2] +
      '">' +
      '<div class="no">' + n + "번</div>" +
      '<div class="nm">' + esc(r.name) + "</div>" +
      '<div><span class="st" style="background:' + c[3] + ";color:" + c[1] + '">' +
      NS_LABEL[r.status] + "</span></div>" +
      (r.reason ? '<div class="rs">' + esc(r.reason) + "</div>" : "") +
      "</div>";
  }

  const body =
    '<div class="top">' +
    "<div>" +
    '<div class="ttl">' + esc(label) + " CIP 현황</div>" +
    '<div class="sub">' + esc(dateLine()) + "</div>" +
    "</div>" +
    '<div class="rt"><div class="tabs">' + tabs + "</div>" +
    '<div class="sum">' + chips + "</div></div>" +
    "</div>" +
    '<div class="grid">' + cells + "</div>";

  return new Response(head + body + "</div></body></html>", {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}