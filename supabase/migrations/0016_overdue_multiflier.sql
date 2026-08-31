-- ============================================================
--  0016  —  연체 배수 (규정 ⑦⑧⑨)
-- ============================================================
-- 기한(부과일+7일)을 7일씩 초과할 때마다 2배, 최대 4배까지.

alter table public.fines
  add column if not exists overdue_multiplier int not null default 1;

alter table public.fines drop constraint if exists fines_multiplier_check;
alter table public.fines
  add constraint fines_multiplier_check check (overdue_multiplier in (1, 2, 4));

-- 기존 doubled 건은 2배로 옮긴다
update public.fines set overdue_multiplier = 2 where status = 'doubled';

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
     set overdue_multiplier =
           case
             when v_today > f.due_date + 14 then 4   -- 2주 초과: 4배 (상한)
             when v_today > f.due_date + 7  then 2   -- 1주 초과: 2배
             else 1
           end,
         status = case
             when v_today > f.due_date + 7 then 'doubled'
             else f.status
           end
   where f.deleted_at is null
     and f.status in ('unpaid', 'doubled');
end;
$$;
revoke all on function public.apply_overdue_fines() from public, anon, authenticated;