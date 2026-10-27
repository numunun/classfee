-- ============================================================
--  0032  —  CIP 특별 일정 (휴무일 · 일부 차수만 운영)
-- ============================================================
-- 지금까지 CIP 운영 여부는 「월~목」 요일로만 정했다.
-- 시험·행사 때문에 특정 날만 쉬거나 1차만 하는 경우를 관리자가 날짜별로 적을 수 있게 한다.
-- 금요일 등 원래 없는 날에 CIP 를 여는 것도 같은 방식으로 적으면 된다.
--
--   sessions = '{}'     → 그날 CIP 전체 휴무
--   sessions = '{1}'    → 1차만 운영
--   sessions = '{1,2,3}'→ 전부 운영 (원래 쉬는 날에 여는 경우)
-- 기록이 없는 날은 예전처럼 월~목 전부 운영, 금~일 휴무.

create table if not exists public.cip_day_overrides (
  day        date primary key,
  sessions   int[] not null default '{}',
  note       text,
  created_by uuid references public.students(id),
  updated_at timestamptz not null default now(),
  constraint cip_day_sessions_check check (sessions <@ array[1, 2, 3])
);

alter table public.cip_day_overrides enable row level security;

drop policy if exists cip_day_select on public.cip_day_overrides;
create policy cip_day_select on public.cip_day_overrides
  for select to authenticated using (true);

drop policy if exists cip_day_admin_write on public.cip_day_overrides;
create policy cip_day_admin_write on public.cip_day_overrides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 그날 운영하는 차수 / 특별 일정 정보
-- ------------------------------------------------------------
create or replace function public.cip_sessions_on(p_day date)
returns int[] language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select o.sessions from public.cip_day_overrides o where o.day = p_day),
    case when extract(isodow from p_day)::int <= 4 then array[1, 2, 3] else '{}'::int[] end
  );
$$;

-- 전자칠판(로그인 없음)과 학생 화면이 함께 쓰는 조회용.
-- special = 관리자가 적어 둔 특별 일정인지 (사유 표시용)
create or replace function public.cip_day_info(p_day date default null)
returns table (day date, sessions int[], note text, special bool)
language sql stable security definer
set search_path = public as $$
  select d,
         public.cip_sessions_on(d),
         (select o.note from public.cip_day_overrides o where o.day = d),
         exists (select 1 from public.cip_day_overrides o where o.day = d)
    from (select coalesce(p_day, public.today_kst()) as d) t;
$$;

revoke all on function public.cip_sessions_on(date) from public;
grant execute on function public.cip_sessions_on(date) to anon, authenticated;
revoke all on function public.cip_day_info(date) from public;
grant execute on function public.cip_day_info(date) to anon, authenticated;

-- ------------------------------------------------------------
-- 학생 본인 신고: 요일 대신 그날 운영 차수로 검사 (나머지는 0025 와 같다)
-- ------------------------------------------------------------
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
  v_open  int[] := public.cip_sessions_on(v_today);
  v_row   public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;
  if (select cip_inactive from public.students where id = v_me) then
    raise exception 'CIP 참여 대상이 아닙니다.';
  end if;
  if cardinality(v_open) = 0 then
    raise exception '오늘은 CIP 운영일이 아닙니다.';
  end if;
  if v_min >= 21 * 60 then
    raise exception '오늘 CIP 신고가 마감됐습니다. 관리자에게 문의하세요.';
  end if;
  if p_session is null or p_session < 1 or p_session > 3 then
    raise exception '올바르지 않은 차수입니다.';
  end if;
  if not (p_session = any(v_open)) then
    raise exception '오늘 %차는 운영하지 않습니다.', p_session;
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

-- ------------------------------------------------------------
-- 전자칠판 신고: 같은 검사 (나머지는 0026 과 같다)
-- ------------------------------------------------------------
create or replace function public.board_report(
  p_grade   int,
  p_class   int,
  p_seat    int,
  p_session int,
  p_status  text,
  p_reason  text default null,
  p_code    text default ''
)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_code     text;
  v_today    date := public.today_kst();
  v_min      int  := extract(hour from (now() at time zone 'Asia/Seoul'))::int * 60
                   + extract(minute from (now() at time zone 'Asia/Seoul'))::int;
  v_open     int[] := public.cip_sessions_on(v_today);
  v_me       uuid;
  v_inactive bool;
  v_row      public.night_study_records%rowtype;
begin
  select board_code into v_code from public.settings where id = 1;
  if coalesce(v_code, '') <> '' and coalesce(p_code, '') is distinct from v_code then
    raise exception '현황판 접근 코드가 올바르지 않습니다.';
  end if;

  if cardinality(v_open) = 0 then
    raise exception '오늘은 CIP 운영일이 아닙니다.';
  end if;
  if v_min >= 21 * 60 then
    raise exception '오늘 CIP 신고가 마감됐습니다.';
  end if;
  if p_session is null or p_session < 1 or p_session > 3 then
    raise exception '올바르지 않은 차수입니다.';
  end if;
  if not (p_session = any(v_open)) then
    raise exception '오늘 %차는 운영하지 않습니다.', p_session;
  end if;
  if p_status not in ('present','academy','hospital','special','other') then
    raise exception '올바르지 않은 상태입니다.';
  end if;

  select id, cip_inactive into v_me, v_inactive
    from public.students
   where student_number = p_grade * 10000 + p_class * 100 + p_seat;
  if v_me is null then raise exception '해당 번호의 학생을 찾을 수 없습니다.'; end if;

  if coalesce(v_inactive, false) then
    raise exception 'CIP 참여 대상이 아닌 학생입니다. 관리자에게 문의하세요.';
  end if;

  select * into v_row from public.night_study_records
   where student_id = v_me and study_date = v_today and session = p_session;
  if found and v_row.self_reported = false then
    raise exception '관리자가 처리한 기록입니다. 관리자에게 문의하세요.';
  end if;

  insert into public.night_study_records
    (student_id, study_date, session, status, reason, self_reported, via_board)
  values
    (v_me, v_today, p_session, p_status,
     nullif(trim(coalesce(p_reason,'')), ''), true, true)
  on conflict (student_id, study_date, session) do update
    set status = excluded.status,
        reason = excluded.reason,
        self_reported = true,
        via_board = true,
        updated_at = now();
end;
$$;
grant execute on function public.board_report(int, int, int, int, text, text, text) to anon, authenticated;
