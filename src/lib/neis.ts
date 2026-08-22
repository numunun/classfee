import "server-only";
import { getSettings } from "@/lib/settings";

export type Meal = {
  /** 조식 / 중식 / 석식 */
  type: string;
  /** 정렬용 코드 (1=조식, 2=중식, 3=석식) */
  order: number;
  /** 요리명 목록 (알레르기 번호 제거됨) */
  menu: string[];
  /** 알레르기 번호가 붙은 원본 */
  raw: string[];
  calorie: string | null;
};

export type MealDay = {
  /** YYYY-MM-DD */
  date: string;
  /** 오늘 급식인지 (false 면 다음 급식일) */
  isToday: boolean;
  meals: Meal[];
};

export type MealResult =
  | { ok: true; day: MealDay }
  | {
      ok: false;
      reason: "no_key" | "no_school_code" | "no_data" | "error";
      message?: string;
    };

/** Date -> YYYYMMDD (한국 시각 기준) */
function ymdSeoul(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts.replaceAll("-", "");
}

/** YYYYMMDD -> YYYY-MM-DD */
function dashed(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** "쌀밥 (1.5.6)" -> "쌀밥" */
function stripAllergy(dish: string): string {
  return dish.replace(/\s*\(?[\d.\s]+\)?\s*$/, "").trim();
}

const MEAL_ORDER: Record<string, number> = { 조식: 1, 중식: 2, 석식: 3 };

/**
 * 오늘부터 향후 며칠치를 한 번에 조회한 뒤,
 * 오늘 급식이 있으면 오늘 것을, 없으면(주말·공휴일·방학) 가장 가까운 급식일을 돌려준다.
 */
export async function fetchMeals(daysAhead = 10): Promise<MealResult> {
  const key = process.env.NEIS_API_KEY;
  if (!key) return { ok: false, reason: "no_key" };

  const s = await getSettings();
  if (!s?.neis_school_code) return { ok: false, reason: "no_school_code" };

  const now = new Date();
  const from = ymdSeoul(now);
  const to = ymdSeoul(new Date(now.getTime() + daysAhead * 86400000));

  const url = new URL("https://open.neis.go.kr/hub/mealServiceDietInfo");
  url.searchParams.set("KEY", key);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "100");
  url.searchParams.set("ATPT_OFCDC_SC_CODE", s.neis_atpt_code);
  url.searchParams.set("SD_SCHUL_CODE", s.neis_school_code);
  url.searchParams.set("MLSV_FROM_YMD", from);
  url.searchParams.set("MLSV_TO_YMD", to);

  try {
    // 급식표는 자주 바뀌지 않으므로 1시간 캐시
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { ok: false, reason: "error", message: `HTTP ${res.status}` };
    const json = await res.json();

    // 데이터가 없으면 RESULT.CODE = INFO-200
    const rows = json?.mealServiceDietInfo?.[1]?.row;
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, reason: "no_data" };
    }

    // 날짜별로 묶는다
    const byDate = new Map<string, Meal[]>();
    for (const r of rows as Record<string, string>[]) {
      const date = String(r.MLSV_YMD || "");
      if (!date) continue;

      const raw = String(r.DDISH_NM || "")
        .split("<br/>")
        .map((x) => x.trim())
        .filter(Boolean);
      const type = String(r.MMEAL_SC_NM || "급식");

      const meal: Meal = {
        type,
        order: MEAL_ORDER[type] ?? Number(r.MMEAL_SC_CODE) ?? 9,
        raw,
        menu: raw.map(stripAllergy).filter(Boolean),
        calorie: r.CAL_INFO ? String(r.CAL_INFO) : null,
      };
      byDate.set(date, [...(byDate.get(date) ?? []), meal]);
    }

    // 오늘 것이 있으면 오늘, 없으면 가장 가까운 미래 날짜
    const dates = [...byDate.keys()].sort();
    const picked = byDate.has(from) ? from : dates.find((d) => d >= from);
    if (!picked) return { ok: false, reason: "no_data" };

    const meals = (byDate.get(picked) ?? []).sort((a, b) => a.order - b.order);

    return {
      ok: true,
      day: { date: dashed(picked), isToday: picked === from, meals },
    };
  } catch (e) {
    return { ok: false, reason: "error", message: (e as Error).message };
  }
}