-- ============================================================
--  0008  —  CIP 1/2/3차 분리, 자주반을 명단 속성으로, 사유 유형 정리
-- ============================================================

-- ---------- 1) 자주반은 학생의 고정 속성 ----------
alter table public.students add column if not exists is_independent bool not null default false;

-- ---------- 2) 출결 기록에 차수 추가 ----------
alter table public.night_study_records add column if not exists session int not null default 1;

alter table public.night_study_records drop constraint if exists ns_session_check;
alter table public.night_study_records
  add constraint ns_session_check check (session between 1 and 3);

alter table public.night_study_records
  drop constraint if exists night_study_records_student_id_study_date_key;
alter table public.night_study_records drop constraint if exists ns_unique;
alter table public.night_study_records
  add constraint ns_unique unique (student_id, study_date, session);

-- ---------- 3) 상태 재정의 ----------
-- 기본은 '참석'이므로 기록이 없으면 참석으로 간주한다.
update public.night_study_records set status = 'other' where status in ('independent','excused','absent');

alter table public.night_study_records drop constraint if exists night_study_records_status_check;
alter table public.night_study_records
  add constraint night_study_records_status_check
  check (status in ('present','academy','hospital','special','other'));

-- ---------- 4) 학원 스케줄도 차수별로 ----------
alter table public.academy_schedules add column if not exists session int not null default 1;

alter table public.academy_schedules drop constraint if exists aca_session_check;
alter table public.academy_schedules
  add constraint aca_session_check check (session between 1 and 3);

alter table public.academy_schedules
  drop constraint if exists academy_schedules_student_id_weekday_key;
alter table public.academy_schedules drop constraint if exists aca_unique;
alter table public.academy_schedules
  add constraint aca_unique unique (student_id, weekday, session);

-- ---------- 5) 학생 본인 신고 (차수별) ----------
create or replace function public.report_night_study(p_session int, p_status text, p_reason text)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me  uuid := public.current_student_id();
  v_row public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;
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
    (v_me, current_date, p_session, p_status, nullif(trim(coalesce(p_reason,'')), ''), true)
  on conflict (student_id, study_date, session) do update
    set status = excluded.status, reason = excluded.reason,
        self_reported = true, updated_at = now();
end;
$$;
grant execute on function public.report_night_study(int, text, text) to authenticated;
drop function if exists public.report_night_study(text, text);

-- ---------- 6) 전자칠판 스냅샷 (차수별) ----------
drop function if exists public.board_snapshot(int, int, text);

create or replace function public.board_snapshot(
  p_grade int, p_class int, p_session int default 1, p_code text default ''
)
returns table (seat_no int, name text, status text, reason text, is_independent bool)
language plpgsql security definer
set search_path = public as $$
declare v_code text;
begin
  select board_code into v_code from public.settings where id = 1;
  if coalesce(v_code, '') <> '' and coalesce(p_code, '') is distinct from v_code then
    raise exception '현황판 접근 코드가 올바르지 않습니다.';
  end if;

  return query
  select
    (s.student_number % 100)::int as seat_no,
    s.name,
    -- 우선순위: 당일 기록 > 학원 정기 스케줄 > 자주반 > 참석(기본값)
    coalesce(
      r.status,
      case when a.student_id is not null then 'academy'
           when s.is_independent then 'independent'
           else 'present' end
    )::text as status,
    coalesce(r.reason, a.note)::text as reason,
    s.is_independent
  from public.students s
  left join public.night_study_records r
    on r.student_id = s.id and r.study_date = current_date and r.session = p_session
  left join public.academy_schedules a
    on a.student_id = s.id
   and a.weekday = extract(isodow from current_date)::int
   and a.session = p_session
  where s.student_number is not null
    and s.student_number / 10000 = p_grade
    and (s.student_number / 100) % 100 = p_class
  order by seat_no;
end;
$$;
grant execute on function public.board_snapshot(int, int, int, text) to anon, authenticated;