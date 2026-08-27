import { fetchMeals } from "@/lib/neis";
import { getDinner } from "@/lib/dinner";
import { todayISO } from "@/lib/night-study";

const HINT: Record<string, string> = {
  no_key: "NEIS API 키가 설정되지 않았어요.",
  no_school_code: "설정 화면에서 학교 코드를 먼저 입력해 주세요.",
  no_data: "앞으로 열흘간 등록된 급식 정보가 없어요.",
  error: "급식 정보를 불러오지 못했어요.",
};

function label(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00+09:00");
  const day = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`;
}

function Dishes({ items }: { items: string[] }) {
  return (
    <ul className="mt-1.5 space-y-0.5">
      {items.map((dish, i) => (
        <li key={i} className="text-sm text-neutral-200">
          {dish}
        </li>
      ))}
    </ul>
  );
}

export async function MealCard({ compact = false }: { compact?: boolean }) {
  const result = await fetchMeals();

  // NEIS 가 잡은 날짜를 기준으로 석식을 찾는다. 급식 정보가 없으면 오늘 기준.
  const targetDate = result.ok ? result.day.date : todayISO();
  const dinnerText = await getDinner(targetDate);
  const dinner = dinnerText
    ? dinnerText.split(",").map((x) => x.trim()).filter(Boolean)
    : null;

  if (!result.ok && !dinner) {
    return (
      <section className="rounded-2xl bg-surface p-5">
        <h2 className="font-medium">🍚 급식</h2>
        <p className="mt-2 text-sm text-neutral-500">{HINT[result.reason]}</p>
      </section>
    );
  }

  const isToday = result.ok ? result.day.isToday : true;
  // 학교가 NEIS 에 중식만 올리므로 조식은 나오지 않는다. 오는 대로 그린다.
  const lunches = result.ok ? result.day.meals : [];

  return (
    <section className="rounded-2xl bg-surface p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-medium">🍚 {isToday ? "오늘의 급식" : "다음 급식"}</h2>
        <span className="text-xs text-neutral-500">{label(targetDate)}</span>
      </div>

      {!isToday && (
        <p className="mt-1 text-xs text-neutral-500">
          오늘은 급식이 없어요. 가장 가까운 날을 보여드릴게요.
        </p>
      )}

      <div className={compact ? "mt-3 grid gap-4 sm:grid-cols-2" : "mt-3 space-y-4"}>
        {lunches.map((m) => (
          <div key={m.type}>
            <p className="text-xs font-medium text-neutral-400">
              🍚 {m.type}
              {m.calorie && <span className="ml-1.5 text-neutral-600">{m.calorie}</span>}
            </p>
            <Dishes items={m.menu} />
          </div>
        ))}

        {dinner && (
          <div>
            <p className="text-xs font-medium text-neutral-400">🌙 석식</p>
            <Dishes items={dinner} />
          </div>
        )}
      </div>
    </section>
  );
}