export type ParsedDinner = { date: string; menu: string };

/**
 * "2026-09-01<탭 또는 쉼표>돈까스, 미소된장국" 형태를 한 줄씩 읽는다.
 * 엑셀에서 두 열을 복사하면 탭으로 구분된 이 형태가 그대로 나온다.
 */
export function parseDinnerText(text: string): { rows: ParsedDinner[]; errors: string[] } {
  const rows: ParsedDinner[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((line, i) => {
    const raw = line.trim();
    if (!raw) return;

    const m = raw.match(/^(\d{4}[-./]\d{1,2}[-./]\d{1,2})\s*[\t,]?\s*(.+)$/);
    if (!m) {
      errors.push(`${i + 1}번째 줄: 날짜를 찾을 수 없어요 — ${raw.slice(0, 20)}`);
      return;
    }

    const [y, mo, d] = m[1].split(/[-./]/);
    const date = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const menu = m[2].trim();

    if (!menu) {
      errors.push(`${i + 1}번째 줄: 메뉴가 비어 있어요`);
      return;
    }
    if (seen.has(date)) {
      errors.push(`${date}: 같은 날짜가 여러 번 있어요`);
      return;
    }
    seen.add(date);
    rows.push({ date, menu });
  });

  return { rows, errors };
}

/** 2026-09-01 -> 9/1 (화) */
export function dinnerLabel(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00+09:00");
  const day = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${day})`;
}