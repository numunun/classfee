-- ============================================================
--  0033  —  지각 누진을 「한 주 단위」로 (매주 ₩1,000 부터 다시)
-- ============================================================
-- 규칙: 같은 주 안에서 지각할 때마다 2배 (1,000 → 2,000 → 4,000 → 8,000 → 16,000 상한),
--       주가 바뀌면 다시 1,000 부터. 주는 일요일에 시작한다.
--
-- 0022 의 next_late_amount 는 시행일(late_policy_start) 이후 지각을 「전부」 세어서
-- 주가 바뀌어도 줄지 않았다. 벌금 부과 화면의 미리보기는 이미 이번 주만 세고 있어서
-- 화면에는 1,000·2,000 으로 보이는데 실제로는 16,000 이 매겨지는 일이 생겼다.

-- 주 시작일 (일요일). extract(dow): 일=0 … 토=6
create or replace function public.week_start(p_day date)
returns date language sql immutable as $$
  select p_day - extract(dow from p_day)::int;
$$;

-- 부과일이 속한 주의 횟수로 금액을 정한다. 부과일을 고르는 화면이라 날짜를 함께 받는다.
drop function if exists public.next_late_amount(uuid);

create or replace function public.next_late_amount(p_student uuid, p_day date default null)
returns int language plpgsql stable
set search_path = public as $$
declare
  v_base  int;
  v_cap   int;
  v_start date;
  v_day   date := coalesce(p_day, public.today_kst());
  v_from  date;
  v_count int;
begin
  select late_fine_amount, late_fine_cap, late_policy_start
    into v_base, v_cap, v_start
    from public.settings where id = 1;

  if v_start is null then return v_base; end if;

  v_from := greatest(public.week_start(v_day), v_start);

  select count(*) into v_count
    from public.fines
   where student_id = p_student
     and type = 'late'
     and deleted_at is null
     and occurred_date >= v_from
     and occurred_date < public.week_start(v_day) + 7;

  return least(v_base * power(2::numeric, v_count), v_cap)::int;
end;
$$;
grant execute on function public.next_late_amount(uuid, date) to authenticated;

-- ------------------------------------------------------------
-- 이미 매겨진 벌금 바로잡기
-- ------------------------------------------------------------
-- 주간 규칙으로 다시 계산했을 때 「더 많이」 매겨진 미납 지각 벌금만 줄인다.
--  - 금액을 올리지는 않는다 (예전에 1,000 정액으로 매겨진 건은 그대로)
--  - 입금 신청 중(pending_approval)·완납 건은 신청 금액과 어긋나므로 건드리지 않는다
-- 같은 주 안 순서는 부과일 → 입력 시각 순이다.
--
-- 먼저 무엇이 바뀌는지 보려면 아래 select 만 따로 실행해 보면 된다.
--   with ranked as (...같은 내용...) select * from ranked where amount > expected;
with s as (
  select late_fine_amount as base, late_fine_cap as cap, late_policy_start as start
    from public.settings where id = 1
),
ranked as (
  select f.id, f.amount, f.status,
         least(
           s.base * power(2::numeric,
             row_number() over (
               partition by f.student_id, public.week_start(f.occurred_date)
               order by f.occurred_date, f.created_at
             ) - 1),
           s.cap
         )::int as expected
    from public.fines f, s
   where s.start is not null
     and f.type = 'late'
     and f.deleted_at is null
     and f.occurred_date >= s.start
)
update public.fines f
   set amount = r.expected
  from ranked r
 where f.id = r.id
   and r.status = 'unpaid'
   and f.amount > r.expected;
