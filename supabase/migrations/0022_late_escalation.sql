-- ============================================================
--  0022  —  지각 벌금 누진제 (2026-09-10 시행)
-- ============================================================
-- 지각 횟수가 늘 때마다 벌금이 2배.  y = 1000 × 2^(x-1),  상한 16,000원
--   1회 1,000 / 2회 2,000 / 3회 4,000 / 4회 8,000 / 5회 이상 16,000
-- 시행일 이전에 부과된 건은 금액을 바꾸지 않으며, 횟수 계산에도 넣지 않는다.

alter table public.settings
  add column if not exists late_policy_start date,
  add column if not exists late_fine_cap int not null default 16000;

update public.settings
   set late_policy_start = date '2026-09-10'
 where id = 1;

/**
 * 이 학생에게 다음에 부과될 지각 벌금액.
 * 시행일 이후의 유효한(취소되지 않은) 지각 건수만 센다.
 */
create or replace function public.next_late_amount(p_student uuid)
returns int language plpgsql stable
set search_path = public as $$
declare
  v_base  int;
  v_cap   int;
  v_start date;
  v_count int;
begin
  select late_fine_amount, late_fine_cap, late_policy_start
    into v_base, v_cap, v_start
    from public.settings where id = 1;

  if v_start is null then return v_base; end if;

  select count(*) into v_count
    from public.fines
   where student_id = p_student
     and type = 'late'
     and deleted_at is null
     and occurred_date >= v_start;

  return least((v_base * power(2, v_count))::int, v_cap);
end;
$$;
grant execute on function public.next_late_amount(uuid) to authenticated;