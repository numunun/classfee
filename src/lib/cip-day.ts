import type { SupabaseClient } from "@supabase/supabase-js";
import { SESSIONS, SESSION_LABEL, todayISO, weekdayIndex, isCipDay, type Session } from "@/lib/night-study";

/**
 * 하루의 CIP 운영 정보.
 * 관리자가 「특별 일정」을 적어 둔 날은 그 차수만 운영하고, 없으면 월~목 전부 운영.
 */
export type CipDay = {
  /** 그날 운영하는 차수. 비어 있으면 CIP 없음 */
  sessions: Session[];
  /** 특별 일정 사유 (예: 중간고사) */
  note: string | null;
  /** 관리자가 적어 둔 특별 일정인지 */
  special: boolean;
};

/** 특별 일정이 없을 때의 기본값 (월~목 전부, 금~일 없음) */
export function defaultCipDay(weekday: number | null = weekdayIndex()): CipDay {
  return { sessions: isCipDay(weekday) ? [...SESSIONS] : [], note: null, special: false };
}

/**
 * 오늘(또는 지정한 날)의 CIP 운영 정보를 DB 에서 읽는다.
 * 로그인 없는 전자칠판에서도 쓰므로 security definer 함수(cip_day_info)를 부른다.
 * 0032 마이그레이션 전이라 함수가 없으면 예전처럼 요일로만 판단한다.
 */
export async function fetchCipDay(supabase: SupabaseClient, day: string = todayISO()): Promise<CipDay> {
  const { data, error } = await supabase.rpc("cip_day_info", { p_day: day });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) {
    const wd = weekdayIndex(new Date(day + "T12:00:00+09:00"));
    return defaultCipDay(wd);
  }
  return {
    sessions: ((row.sessions ?? []) as number[])
      .filter((n): n is Session => (SESSIONS as readonly number[]).includes(n))
      .sort(),
    note: row.note ?? null,
    special: !!row.special,
  };
}

/** 「1·2차만 운영」 같은 한 줄 설명 */
export function describeCipDay(day: CipDay): string {
  if (day.sessions.length === 0) return "CIP 없음";
  if (day.sessions.length === SESSIONS.length) return "전체 운영";
  return day.sessions.map((n) => SESSION_LABEL[n].replace("차", "")).join("·") + "차만 운영";
}
