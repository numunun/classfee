-- ============================================================
--  0011  —  석식 직접 입력 + CIP 운영 요일 제한
-- ============================================================

-- ------------------------------------------------------------
-- 1) 석식 식단 (학교가 NEIS 에 중식만 올리므로 직접 입력한다)
-- ------------------------------------------------------------
create table if not exists public.dinner_menus (
  meal_date  date primary key,
  menu       text not null,
  created_by uuid references public.students(id),
  updated_at timestamptz not null default now()
);

alter table public.dinner_menus enable row level security;

drop policy if exists dinner_select on public.dinner_menus;
create policy dinner_select on public.dinner_menus
  for select to authenticated using (true);

drop policy if exists dinner_admin_write on public.dinner_menus;
create policy dinner_admin_write on public.dinner_menus
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 2) CIP 는 월~목만 운영 (금요일·주말 없음)
-- ------------------------------------------------------------
-- 학생 신고를 DB 단에서도 막는다. 화면에서 막아도 rpc 직접 호출이 가능하므로.
create or replace function public.report_night_study(
  p_session int,
  p_status  text,
  p_reason  text
)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me  uuid := public.current_student_id();
  v_row public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;

  -- isodow: 1=월 … 7=일. CIP 는 월~목만.
  if extract(isodow from current_date)::int > 4 then
    raise exception '오늘은 CIP 운영일이 아닙니다.';
  end if;

  if p_session is null or p_session < 1 or p_session > 3 then
    raise exception '올바르지 않은 차수입니다.';
  end if;
  if p_status not in ('present','academy','hospital','special','other') then
    raise exception '올바르지 않은 상태입니다.';
  end if;
  if p_status <> 'present' and (p_reason is null or length(trim(p_reason)) = 0) then
    raise exception '사유를 입력하세요.';
  end if;

  select * into v_row from public.night_study_records
   where student_id = v_me and study_date = current_date and session = p_session;

  if found and v_row.self_reported = false then
    raise exception '관리자가 이미 처리한 기록입니다. 관리자에게 문의하세요.';
  end if;

  insert into public.night_study_records
    (student_id, study_date, session, status, reason, self_reported)
  values
    (v_me, current_date, p_session, p_status,
     nullif(trim(coalesce(p_reason,'')), ''), true)
  on conflict (student_id, study_date, session) do update
    set status = excluded.status,
        reason = excluded.reason,
        self_reported = true,
        updated_at = now();
end;
$$;
grant execute on function public.report_night_study(int, text, text) to authenticated;