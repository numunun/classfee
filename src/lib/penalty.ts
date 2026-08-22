// [별표 3] 2학년 9반 벌금 및 누적 규정 ⑤
// 누적 벌금액에 따른 조치. 60,000원 이후로는 10,000원마다 같은 조치가 반복된다.

export type Penalty = { amount: number; label: string };

const FIXED: Penalty[] = [
  { amount: 15000, label: "구두 경고" },
  { amount: 30000, label: "한시적 청소 추가 배정" },
  { amount: 45000, label: "학급 봉사활동" },
  { amount: 60000, label: "담임 교사와의 데이트" },
];

const REPEAT_FROM = 60000;
const REPEAT_STEP = 10000;
const REPEAT_LABEL = "담임 교사와의 데이트";

/** 아직 넘지 않은 다음 문턱. 반복 구간에서는 다음 10,000원 지점을 돌려준다. */
export function nextPenalty(total: number): Penalty {
  for (const p of FIXED) {
    if (total < p.amount) return p;
  }
  const times = Math.floor((total - REPEAT_FROM) / REPEAT_STEP) + 1;
  return { amount: REPEAT_FROM + times * REPEAT_STEP, label: REPEAT_LABEL };
}

/** 이미 도달한 조치 중 가장 높은 것. 아직 아무것도 없으면 null */
export function currentPenalty(total: number): Penalty | null {
  if (total < FIXED[0].amount) return null;
  if (total < REPEAT_FROM) {
    let cur: Penalty | null = null;
    for (const p of FIXED) {
      if (total >= p.amount) cur = p;
    }
    return cur;
  }
  const times = Math.floor((total - REPEAT_FROM) / REPEAT_STEP);
  return { amount: REPEAT_FROM + times * REPEAT_STEP, label: REPEAT_LABEL };
}

/** 담임 교사와의 데이트가 몇 번째인지 (60,000원=1회차). 아니면 null */
export function dateCount(total: number): number | null {
  if (total < REPEAT_FROM) return null;
  return Math.floor((total - REPEAT_FROM) / REPEAT_STEP) + 1;
}