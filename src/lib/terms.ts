import { todayISO } from "@/lib/night-study";

/**
 * 약관 버전. 값은 그 판의 시행일(YYYY-MM-DD)이라 날짜 비교로 판을 고를 수 있다.
 *
 * 약관을 바꿀 때는 제20조에 따라 시행일 7일 전(중요 변경은 30일 전)부터 알려야 하므로,
 * 개정판을 미리 배포해 두고 시행일이 되면 자동으로 바뀌게 한다.
 *  - 시행일 전: 동의는 지금 판(PREV)으로 받는다. 개정판은 한 번 안내 창으로 보여주고
 *              (미리 동의하거나 「나중에」로 넘길 수 있음), 약관 페이지에서도 미리 보여준다.
 *  - 시행일부터: 개정판(NEXT)에 동의하지 않은 이용자는 동의해야 서비스를 쓸 수 있다.
 * 내용을 크게 고칠 때만 판을 바꾼다. (오타 수정 정도로는 바꾸지 않는다)
 */
export const PREV_TERMS_VERSION = "2026-10-13";
export const NEXT_TERMS_VERSION = "2026-11-04";

/** 그날(한국 날짜) 시행 중인 약관 판 */
export function termsVersionOn(day: string = todayISO()): string {
  return day >= NEXT_TERMS_VERSION ? NEXT_TERMS_VERSION : PREV_TERMS_VERSION;
}

/** 개정판이 아직 시행 전(사전 공지 기간)인지 */
export function isNextTermsPending(day: string = todayISO()): boolean {
  return day < NEXT_TERMS_VERSION;
}

/**
 * 이 사람이 그날 필요한 판에 동의했는지.
 * 판 값이 시행일이라 더 새 판에 미리 동의한 경우도 통과한다.
 */
export function hasAgreedTerms(agreed: string | null | undefined, day: string = todayISO()): boolean {
  return !!agreed && agreed >= termsVersionOn(day);
}

/** "2026-11-04" → "11월 4일" */
export function termsDateLabel(version: string): string {
  const [, m, d] = version.split("-").map(Number);
  return `${m}월 ${d}일`;
}
