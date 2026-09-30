/**
 * 한글 검색 보조.
 * 완성형 한글(가~힣)은 유니코드에서 규칙적으로 배열돼 있어서
 * 코드값 계산만으로 초성을 뽑아낼 수 있다.
 */

const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
  "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const BASE = 0xac00; // '가'
const LAST = 0xd7a3; // '힣'

/** "황성재" -> "ㅎㅅㅈ" (한글이 아닌 글자는 그대로 둔다) */
export function toChoseong(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= BASE && code <= LAST) {
      out += CHO[Math.floor((code - BASE) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

/** 입력이 초성만으로 이루어져 있는지 (ㅎㅅㅈ 처럼) */
export function isChoseongOnly(text: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(text.replace(/\s/g, ""));
}

/**
 * 검색어가 대상과 맞는지.
 * - 초성만 입력하면 초성으로 비교 ("ㅎㅅㅈ" → 황성재)
 * - 그 외에는 일반 부분 일치
 */
export function matches(target: string, query: string): boolean {
  const q = query.replace(/\s/g, "");
  if (!q) return true;

  if (isChoseongOnly(q)) {
    return toChoseong(target).replace(/\s/g, "").includes(q);
  }
  return target.replace(/\s/g, "").toLowerCase().includes(q.toLowerCase());
}