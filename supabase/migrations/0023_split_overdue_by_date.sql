-- ============================================================
--  0023  —  연체 2배를 시행일 기준으로 분리
-- ============================================================
-- 9/9 까지 부과된 건: 기존대로 연체 시 2배 (1주당, 최대 2배)
-- 9/10 부터 부과된 건: 지각 누진제로만 오르고, 연체 배수는 없음
--
-- late_policy_start(2026-09-10) 이후 부과된 건은 apply_overdue_fines 에서 제외한다.

create or replace function public.apply_overdue_fines()
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_today date := public.today_kst();
  v_start date;
begin
  if not (select double_fine_enabled from public.settings where id = 1) then
    return;
  end if;
  select late_policy_start into v_start from public.settings where id = 1;

  update public.fines f
     set overdue_multiplier = case when v_today > f.due_date then 2 else 1 end,
         status = case when v_today > f.due_date then 'doubled' else f.status end
   where f.deleted_at is null
     and f.overdue_waived = false
     and f.status in ('unpaid', 'doubled')
     -- 시행일 이후 부과된 건은 연체 배수를 적용하지 않는다
     and (v_start is null or f.occurred_date < v_start);
end;
$$;
revoke all on function public.apply_overdue_fines() from public, anon, authenticated;

-- 실수로 2배가 붙은 신규(9/10 이후) 건이 있으면 원금으로 되돌린다
update public.fines f
   set overdue_multiplier = 1,
       status = case when status = 'doubled' then 'unpaid' else status end
  from public.settings s
 where s.id = 1
   and s.late_policy_start is not null
   and f.occurred_date >= s.late_policy_start
   and f.overdue_multiplier > 1
   and f.deleted_at is null;