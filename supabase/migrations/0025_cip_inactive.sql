-- ============================================================
--  0025  —  CIP 비활성화 (아예 참여하지 않는 학생)
-- ============================================================
-- 자주반과 달리 CIP 자체를 하지 않는 학생을 표시한다.
-- 우선순위: 관리자 기록 > 비활성화 > 본인 신고 > 학원 > 자주반 > 참석

alter table public.students
  add column if not exists cip_inactive bool not null default false;

create or replace function public.board_snapshot(
  p_grade   int,
  p_class   int,
  p_session int default 1,
  p_code    text default ''
)
returns table (
  seat_no        int,
  name           text,
  status         text,
  reason         text,
  is_independent bool
)
language plpgsql security definer
set search_path = public as $$
declare
  v_code  text;
  v_today date := public.today_kst();
begin
  select board_code into v_code from public.settings where id = 1;
  if coalesce(v_code, '') <> '' and coalesce(p_code, '') is distinct from v_code then
    raise exception '현황판 접근 코드가 올바르지 않습니다.';
  end if;

  return query
  select
    (s.student_number % 100)::int as seat_no,
    s.name,
    case
      -- 관리자가 직접 지정한 기록이 최우선
      when r.id is not null and r.self_reported = false then r.status
      -- 그다음 비활성화 (CIP 자체를 안 하는 학생)
      when s.cip_inactive then 'inactive'
      -- 이하 기존 우선순위
      when r.id is not null then r.status
      when a.student_id is not null then 'academy'
      when s.is_independent then 'independent'
      else 'present'
    end::text as status,
    case
      when s.cip_inactive and (r.id is null or r.self_reported = true) then null
      else coalesce(r.reason, a.note)
    end::text as reason,
    s.is_independent
  from public.students s
  left join public.night_study_records r
    on r.student_id = s.id
   and r.study_date = v_today
   and r.session = p_session
  left join public.academy_schedules a
    on a.student_id = s.id
   and a.weekday = extract(isodow from v_today)::int
   and a.session = p_session
  where s.student_number is not null
    and s.student_number / 10000 = p_grade
    and (s.student_number / 100) % 100 = p_class
  order by seat_no;
end;
$$;
grant execute on function public.board_snapshot(int, int, int, text) to anon, authenticated;

-- 비활성 학생은 본인 신고를 막는다 (관리자는 setNightStatus 로 계속 가능)
create or replace function public.report_night_study(
  p_session int, p_status text, p_reason text
)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me    uuid := public.current_student_id();
  v_today date := public.today_kst();
  v_min   int  := extract(hour from (now() at time zone 'Asia/Seoul'))::int * 60
                + extract(minute from (now() at time zone 'Asia/Seoul'))::int;
  v_row   public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;
  if (select cip_inactive from public.students where id = v_me) then
    raise exception 'CIP 참여 대상이 아닙니다.';
  end if;
  if extract(isodow from v_today)::int > 4 then
    raise exception '오늘은 CIP 운영일이 아닙니다.';
  end if;
  if v_min >= 21 * 60 then
    raise exception '오늘 CIP 신고가 마감됐습니다. 관리자에게 문의하세요.';
  end if;
  if p_session is null or p_session < 1 or p_session > 3 then
    raise exception '올바르지 않은 차수입니다.';
  end if;
  if p_status not in ('present','academy','hospital','special','other') then
    raise exception '올바르지 않은 상태입니다.';
  end if;

  select * into v_row from public.night_study_records
   where student_id = v_me and study_date = v_today and session = p_session;
  if found and v_row.self_reported = false then
    raise exception '관리자가 이미 처리한 기록입니다. 관리자에게 문의하세요.';
  end if;

  insert into public.night_study_records
    (student_id, study_date, session, status, reason, self_reported)
  values
    (v_me, v_today, p_session, p_status,
     nullif(trim(coalesce(p_reason,'')), ''), true)
  on conflict (student_id, study_date, session) do update
    set status = excluded.status, reason = excluded.reason,
        self_reported = true, updated_at = now();
end;
$$;
grant execute on function public.report_night_study(int, text, text) to authenticated;