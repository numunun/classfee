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
 * Next.js 의 React 런타임 / Tailwind CSS 를 전혀 거치지 않고
 * 서버에서 만든 순수 HTML 문자열만 내려보낸다.
 * - 자바스크립트 0줄 (meta refresh 로 갱신)
 * - CSS 는 인라인 + 구형 문법만 (table 레이아웃, vh, hex)
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

// 표 전체 높이. 화면 아래가 잘리면 이 숫자를 줄이고, 여백이 남으면 늘린다.
const TABLE_H = "72vh";

// [배경, 글자, 테두리]
const COLOR: Record<NightStatus, [string, string, string]> = {
  present: ["#0d2818", "#7ee2a8", "#1f5c3a"],
  independent: ["#0b2a24", "#6fe0c4", "#1c5c50"],
  academy: ["#2b2109", "#f0c674", "#6b5312"],
  hospital: ["#2b1216", "#f09aa8", "#6b2c36"],
  special: ["#1e1430", "#c4a8f0", "#4a3374"],
  other: ["#1f1f22", "#c8c8cc", "#44444a"],
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

  // 자동 갱신 주소 (선택한 차수를 명시하지 않으면 시간에 따라 자동 전환)
  const refreshTarget =
    "?" + (explicit ? "s=" + explicit + "&" : "") + (code ? "k=" + encodeURIComponent(code) : "");

  const head =
    '<!DOCTYPE html>' +
    '<html lang="ko"><head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta http-equiv="refresh" content="60;url=' + esc(refreshTarget) + '">' +
    "<title>CIP 현황판</title>" +
    "<style>" +
    // 세로 기준(vh)으로 크기를 잡아 항상 한 화면에 들어가게 한다.
    // 표가 넘치면 위의 TABLE_H 숫자만 줄이면 된다.
    "html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#000;color:#eee;" +
    "font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;}" +
    "*{box-sizing:border-box;}" +
    ".wrap{height:100%;padding:0.8vh 1vw;}" +
    "h1{margin:0;font-size:2.8vh;font-weight:bold;color:#fff;line-height:1.1;}" +
    ".sub{margin:0.2vh 0 0 0;font-size:1.5vh;color:#999;}" +
    ".tabs{margin:0.5vh 0 0 0;}" +
    ".tab{display:inline-block;padding:0.2vh 1.1vh;margin-right:0.5vh;font-size:1.5vh;" +
    "border:2px solid #333;color:#888;text-decoration:none;}" +
    ".tab-on{background:#fff;color:#000;border-color:#fff;font-weight:bold;}" +
    ".tab-live{border-color:#2e8b57;color:#7ee2a8;}" +
    ".sum{margin:0.4vh 0 0 0;font-size:1.5vh;color:#bbb;}" +
    "table{width:100%;height:" + TABLE_H + ";border-collapse:separate;border-spacing:0.4vh;" +
    "margin-top:0.4vh;table-layout:fixed;}" +
    "td{width:14%;text-align:center;vertical-align:middle;padding:0.2vh 0.2vh;" +
    "border-width:2px;border-style:solid;overflow:hidden;}" +
    ".no{font-size:1.2vh;color:#777;line-height:1.2;}" +
    ".nm{font-size:2.3vh;font-weight:bold;color:#fff;margin-top:0.2vh;line-height:1.2;" +
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
    ".st{font-size:1.6vh;margin-top:0.2vh;line-height:1.2;}" +
    ".rs{font-size:1.2vh;color:#999;margin-top:0.1vh;line-height:1.2;" +
    "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
    ".empty{border-color:#222;color:#333;}" +
    "</style></head><body><div class=\"wrap\">";

  if (error) {
    const body =
      '<h1 style="color:#f09aa8">현황판을 열 수 없습니다</h1>' +
      '<p class="sub">' + esc(error.message) + "</p>";
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
    tabs += '<a class="' + cls + '" href="' + esc(href) + '">' + SESSION_LABEL[n] + "</a>";
  }

  // 상태별 인원
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;
  const order: NightStatus[] = ["present", "independent", "academy", "hospital", "special", "other"];
  const summary = order
    .filter((k) => counts[k])
    .map((k) => NS_LABEL[k] + " " + counts[k] + "명")
    .join("  ·  ");

  // 좌석 표
  let cells = "";
  for (let n = 1; n <= maxSeat; n++) {
    if (n % COLS === 1) cells += "<tr>";
    const r = bySeat[n];
    if (!r) {
      cells += '<td class="empty"><div class="no">' + n + "번</div></td>";
    } else {
      const c = COLOR[r.status] || COLOR.other;
      cells +=
        '<td style="background:' + c[0] + ";border-color:" + c[2] + '">' +
        '<div class="no">' + n + "번</div>" +
        '<div class="nm">' + esc(r.name) + "</div>" +
        '<div class="st" style="color:' + c[1] + '">' + NS_LABEL[r.status] + "</div>" +
        (r.reason ? '<div class="rs">' + esc(r.reason) + "</div>" : "") +
        "</td>";
    }
    if (n % COLS === 0 || n === maxSeat) cells += "</tr>";
  }

  const body =
    "<h1>" + esc(label) + " CIP 현황</h1>" +
    '<p class="sub">' + esc(dateLine()) + " 기준</p>" +
    '<div class="tabs">' + tabs + "</div>" +
    '<p class="sum">' + summary + "</p>" +
    "<table>" + cells + "</table>";

  return new Response(head + body + "</div></body></html>", {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}