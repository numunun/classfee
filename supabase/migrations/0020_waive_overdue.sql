-- ============================================================
--  0020  —  연체 배수 면제 (구제 처리)
-- ============================================================
-- 이미 입금했는데 신청을 깜빡했거나, 서비스 장애로 신청이 누락된 경우
-- 관리자가 배수를 1배로 되돌릴 수 있게 한다.
-- 이후 크론이 다시 2배로 올리지 않도록 면제 표시를 남긴다.

alter table public.fines
  add column if not exists overdue_waived    bool not null default false,
  add column if not exists overdue_waived_by uuid references public.students(id),
  add column if not exists overdue_waive_reason text;

-- 면제된 건은 배수를 올리지 않는다
create or replace function public.apply_overdue_fines()
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_today date := public.today_kst();
begin
  if not (select double_fine_enabled from public.settings where id = 1) then
    return;
  end if;

  update public.fines f
     set overdue_multiplier = case when v_today > f.due_date + 7 then 2 else 1 end,
         status = case when v_today > f.due_date + 7 then 'doubled' else f.status end
   where f.deleted_at is null
     and f.overdue_waived = false
     and f.status in ('unpaid', 'doubled');
end;
$$;
revoke all on function public.apply_overdue_fines() from public, anon, authenticated;