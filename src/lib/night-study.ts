export type NightStatus =
  | "present"      // 참석 (기본값)
  | "independent"  // 자주반 — students.is_independent 로 자동 판정
  | "academy"      // 학원
  | "hospital"     // 병원
  | "special"      // 특별실
  | "other";       // 기타

/** 학생이 직접 고를 수 있는 사유 (참석 제외) */
export const REASON_TYPES = ["academy", "hospital", "special", "other"] as const;
export type ReasonType = (typeof REASON_TYPES)[number];

export const NS_LABEL: Record<NightStatus, string> = {
  present: "참석",
  independent: "자주반",
  academy: "학원",
  hospital: "병원",
  special: "특별실",
  other: "기타",
};

export const NS_ICON: Record<NightStatus, string> = {
  present: "✓",
  independent: "🏫",
  academy: "📚",
  hospital: "🏥",
  special: "🔬",
  other: "•",
};

export const NS_STYLE: Record<NightStatus, string> = {
  present: "bg-green-950 text-green-300 border-green-800/70",
  independent: "bg-emerald-950 text-emerald-300 border-emerald-700/70",
  academy: "bg-amber-950 text-amber-300 border-amber-800/70",
  hospital: "bg-rose-950 text-rose-300 border-rose-800/70",
  special: "bg-violet-950 text-violet-300 border-violet-800/70",
  other: "bg-neutral-800 text-neutral-300 border-neutral-600/70",
};

export const REASON_PLACEHOLDER: Record<ReasonType, string> = {
  academy: "예: 수학학원 7시",
  hospital: "예: 치과 진료",
  special: "예: 물리실 실험",
  other: "사유를 입력하세요",
};

/** CIP 차수 */
export const SESSIONS = [1, 2, 3] as const;
export type Session = (typeof SESSIONS)[number];
export const SESSION_LABEL: Record<Session, string> = { 1: "1차", 2: "2차", 3: "3차" };

/** CIP 차수별 운영 시간 (분 단위, 0시 기준) */
export const SESSION_TIME: Record<Session, { start: number; end: number; label: string }> = {
  1: { start: 16 * 60 + 50, end: 17 * 60 + 40, label: "16:50–17:40" },
  2: { start: 18 * 60 + 40, end: 20 * 60 + 0, label: "18:40–20:00" },
  3: { start: 20 * 60 + 10, end: 21 * 60 + 0, label: "20:10–21:00" },
};

/** CIP 운영 요일: 월~목 (금요일·주말은 없음) */
/**
 * 학원에 가는 차수. 학원 가는 날에도 1차는 참석하고 2·3차에 빠진다.
 * 그래서 학원 스케줄은 요일만 지정하고 차수는 여기서 고정한다.
 */
export const ACADEMY_SESSIONS: readonly Session[] = [2, 3];
export function isCipDay(weekday: number | null): boolean {
  return weekday !== null && weekday >= 1 && weekday <= 4;
}

/** 지금이 몇 차 시간인지. 어느 구간에도 없으면 null */
export function liveSessionAt(minutesOfDay: number): Session | null {
  for (const n of SESSIONS) {
    const t = SESSION_TIME[n];
    if (minutesOfDay >= t.start && minutesOfDay < t.end) return n;
  }
  return null;
}

/**
 * 한국 시각 기준 "자정부터 몇 분"인지.
 * 서버(Vercel)는 UTC 로 돌기 때문에 new Date().getHours() 를 쓰면 9시간이 어긋난다.
 * 그래서 항상 Asia/Seoul 로 명시해 계산한다.
 */
export function seoulMinutesOfDay(d = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return (h % 24) * 60 + m;
}

/** 20935 -> { grade: 2, classNo: 9, seat: 35 } */
export function parseStudentNumber(n: number | null) {
  if (n == null) return null;
  return { grade: Math.floor(n / 10000), classNo: Math.floor(n / 100) % 100, seat: n % 100 };
}

/** 20935 -> 35 */
export function seatNo(studentNumber: number | null): number | null {
  return studentNumber == null ? null : studentNumber % 100;
}

/** JS getDay(0=일) -> 1=월 … 5=금, 주말이면 null */
export function weekdayIndex(d = new Date()): number | null {
  const g = d.getDay();
  return g >= 1 && g <= 5 ? g : null;
}

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}