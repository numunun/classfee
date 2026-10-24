export type NightStatus =
  | "present"      // 참석 (기본값)
  | "independent"  // 자주반 — students.is_independent 로 자동 판정
  | "academy"      // 학원
  | "hospital"     // 병원
  | "special"      // 특별실
  | "other"        // 기타
  | "inactive";    // CIP 자체를 하지 않는 학생

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
  inactive: "비활성화",
};

export const NS_ICON: Record<NightStatus, string> = {
  present: "✓",
  independent: "🏫",
  academy: "📚",
  hospital: "🏥",
  special: "🔬",
  other: "•",
  inactive: "-",
};

export const NS_STYLE: Record<NightStatus, string> = {
  // 반투명 틴트라 어두운·밝은 테마 모두에서 그대로 쓸 수 있다
  present: "bg-green-500/15 text-green-400 border-green-500/25",
  independent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  academy: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  hospital: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  special: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  other: "bg-neutral-500/15 text-neutral-300 border-neutral-500/25",
  inactive: "bg-neutral-500/10 text-neutral-500 border-neutral-500/15",
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
export const SESSION_LABEL: Record<Session, string> = {
  1: "1차",
  2: "2차",
  3: "3차",
};

/** CIP 차수별 운영 시간 (분 단위, 0시 기준) */
export const SESSION_TIME: Record<Session, { start: number; end: number; label: string }> = {
  1: { start: 16 * 60 + 50, end: 17 * 60 + 40, label: "16:50–17:40" },
  2: { start: 18 * 60 + 40, end: 20 * 60 + 0, label: "18:40–20:00" },
  3: { start: 20 * 60 + 10, end: 21 * 60 + 0, label: "20:10–21:00" },
};

/**
 * 학원에 가는 차수. 학원 가는 날에도 1차는 참석하고 2·3차에 빠진다.
 * 그래서 학원 스케줄은 요일만 지정하고 차수는 여기서 고정한다.
 */
export const ACADEMY_SESSIONS: readonly Session[] = [2, 3];

/** 하루 한 차수의 기록 (night_study_records 한 줄) */
export type NightRecord = {
  status: NightStatus;
  reason: string | null;
  selfReported: boolean;
};

/** 상태가 어디서 나왔는지. 화면에서 「관리자 지정」「학원 요일」 같은 꼬리표를 붙일 때 쓴다. */
export type NightSource = "admin" | "inactive" | "self" | "academy" | "independent" | "default";

/**
 * 한 학생의 한 차수 상태를 정한다.
 *
 * 우선순위는 DB 의 board_snapshot 과 반드시 같아야 한다.
 *   관리자 기록 > 비활성화 > 본인 신고 > 학원 > 자주반 > 참석
 *
 * 예전에는 화면마다 이 판단을 따로 해서, 관리자 화면은 비활성화를 반영하고
 * 학생 상세·미리보기는 반영하지 않는 식으로 어긋났다. 이제 전부 여기를 거친다.
 */
export function resolveNight(input: {
  record?: NightRecord | null;
  inactive: boolean;
  /** 오늘 이 차수가 학원 스케줄에 걸리는지 */
  academy: boolean;
  academyNote?: string | null;
  independent: boolean;
}): { status: NightStatus; reason: string | null; source: NightSource } {
  const { record, inactive, academy, academyNote, independent } = input;
  if (record && !record.selfReported) {
    return { status: record.status, reason: record.reason, source: "admin" };
  }
  if (inactive) return { status: "inactive", reason: null, source: "inactive" };
  if (record) return { status: record.status, reason: record.reason, source: "self" };
  if (academy) return { status: "academy", reason: academyNote ?? null, source: "academy" };
  if (independent) return { status: "independent", reason: null, source: "independent" };
  return { status: "present", reason: null, source: "default" };
}

/** 학원 요일 목록만 있을 때, 오늘 이 차수가 학원인지 (학원은 2·3차 고정) */
export function isAcademySession(
  weekday: number | null,
  academyDays: readonly number[],
  session: number
): boolean {
  return (
    weekday !== null &&
    academyDays.includes(weekday) &&
    (ACADEMY_SESSIONS as readonly number[]).includes(session)
  );
}

/** CIP 운영 요일: 월~목 (금요일·주말은 없음) */
export function isCipDay(weekday: number | null): boolean {
  return weekday !== null && weekday >= 1 && weekday <= 4;
}

/** CIP 신고 마감 시각 (3차 종료). 이 시각 이후에는 학생이 못 고친다. */
export const REPORT_CUTOFF = SESSION_TIME[3].end;

/** 지금 학생이 CIP 신고를 할 수 있는지 (한국 시각 기준) */
export function isReportOpen(): boolean {
  return seoulMinutesOfDay() < REPORT_CUTOFF;
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

/**
 * 한국 시각 기준 오늘 (YYYY-MM-DD).
 * Vercel 은 리전과 무관하게 프로세스 시간대가 UTC 라서
 * new Date().getDate() 를 쓰면 한국 자정~오전 9시 사이에 하루가 밀린다.
 */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 한국 시각 기준 요일. 1=월 … 5=금, 주말이면 null */
export function weekdayIndex(d = new Date()): number | null {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
  return map[wd] ?? null;
}