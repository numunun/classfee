-- ============================================================
--  0006  —  급식(NEIS 연동 설정) + 야간자율학습
-- ============================================================

-- ---------- settings: NEIS 학교 코드 ----------
alter table public.settings add column if not exists neis_atpt_code   text not null default 'G10';
alter table public.settings add column if not exists neis_school_code text not null default '';
alter table public.settings add column if not exists class_label      text not null default '2학년 9반';

-- ---------- 야자 출결 ----------
create table if not exists public.night_study_records (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students(id) on delete cascade,
  study_date    date not null default current_date,
  status        text not null check (status in ('present','absent','academy','excused')),
  reason        text,
  self_reported bool not null default false,   -- 학생 본인이 찍었는지
  recorded_by   uuid references public.students(id),
  updated_at    timestamptz not null default now(),
  unique (student_id, study_date)
);
create index if not exists idx_ns_date on public.night_study_records(study_date);

-- ---------- 학원 정기 스케줄 (관리자가 기입) ----------
create table if not exists public.academy_schedules (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  weekday     int  not null check (weekday between 1 and 5),  -- 1=월 … 5=금
  note        text,
  created_by  uuid references public.students(id),
  unique (student_id, weekday)
);

-- ---------- RLS ----------
alter table public.night_study_records enable row level security;
alter table public.academy_schedules   enable row level security;

-- 야자 현황은 반 전체가 공유하는 정보 (전자칠판) → 로그인 사용자 모두 조회 가능
drop policy if exists ns_select on public.night_study_records;
create policy ns_select on public.night_study_records
  for select to authenticated using (true);

-- 쓰기는 관리자만. 학생 본인 신고는 report_night_study() RPC 로만.
drop policy if exists ns_admin_write on public.night_study_records;
create policy ns_admin_write on public.night_study_records
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists aca_select on public.academy_schedules;
create policy aca_select on public.academy_schedules
  for select to authenticated using (true);

drop policy if exists aca_admin_write on public.academy_schedules;
create policy aca_admin_write on public.academy_schedules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- 학생 본인 출결 신고 ----------
-- 오늘 날짜만, 본인 것만. 관리자가 이미 처리한 기록은 덮어쓸 수 없다.
create or replace function public.report_night_study(p_status text, p_reason text)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me  uuid := public.current_student_id();
  v_row public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;
  if p_status not in ('present','absent','academy') then
    raise exception '올바르지 않은 상태입니다.';
  end if;
  if p_status <> 'present' and (p_reason is null or length(trim(p_reason)) = 0) then
    raise exception '사유를 입력하세요.';
  end if;

  select * into v_row from public.night_study_records
   where student_id = v_me and study_date = current_date;

  if found and v_row.self_reported = false then
    raise exception '관리자가 이미 처리한 기록입니다. 관리자에게 문의하세요.';
  end if;

  insert into public.night_study_records (student_id, study_date, status, reason, self_reported)
  values (v_me, current_date, p_status, nullif(trim(coalesce(p_reason,'')), ''), true)
  on conflict (student_id, study_date) do update
    set status = excluded.status,
        reason = excluded.reason,
        self_reported = true,
        updated_at = now();
end;
$$;
grant execute on function public.report_night_study(text, text) to authenticated;