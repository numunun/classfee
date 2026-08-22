import { fetchMeals } from "@/lib/neis";

const HINT: Record<string, string> = {
  no_key: "NEIS API 키가 설정되지 않았어요. (NEIS_API_KEY)",
  no_school_code: "설정 화면에서 학교 코드를 먼저 입력해 주세요.",
  no_data: "앞으로 열흘간 등록된 급식 정보가 없어요.",
  error: "급식 정보를 불러오지 못했어요.",
};

const ICON: Record<string, string> = { 조식: "🌅", 중식: "🍚", 석식: "🌙" };

function label(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00+09:00");
  const day = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`;
}

export async function MealCard({ compact = false }: { compact?: boolean }) {
  const result = await fetchMeals();

  if (!result.ok) {
    return (
      <section className="rounded-2xl bg-surface p-5">
        <h2 className="font-medium">🍚 급식</h2>
        <p className="mt-2 text-sm text-neutral-500">{HINT[result.reason]}</p>
      </section>
    );
  }

  const { date, isToday, meals } = result.day;

  return (
    <section className="rounded-2xl bg-surface p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-medium">🍚 {isToday ? "오늘의 급식" : "다음 급식"}</h2>
        {!isToday && <span className="text-xs text-neutral-500">{label(date)}</span>}
      </div>

      {!isToday && (
        <p className="mt-1 text-xs text-neutral-500">
          오늘은 급식이 없어요. 가장 가까운 날을 보여드릴게요.
        </p>
      )}

      <div className={compact ? "mt-3 grid gap-4 sm:grid-cols-3" : "mt-3 space-y-4"}>
        {meals.map((m) => (
          <div key={m.type}>
            <p className="text-xs font-medium text-neutral-400">
              {ICON[m.type] ?? "🍽"} {m.type}
              {m.calorie && <span className="ml-1.5 text-neutral-600">{m.calorie}</span>}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {m.menu.map((dish, i) => (
                <li key={i} className="text-sm text-neutral-200">
                  {dish}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}