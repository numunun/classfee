-- ============================================================
--  0015  —  모든 '오늘' 판정을 한국 시각 기준으로
-- ============================================================
-- Supabase 의 current_date 는 UTC 기준이라 한국 자정이 아니라 오전 9시에 날짜가 바뀐다.
-- 그래서 CIP 출결이 자정에 초기화되지 않고 다음 날 오전 9시까지 남아 있었다.

create or replace function public.today_kst()
returns date language sql stable
set search_path = public as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;
grant execute on function public.today_kst() to anon, authenticated;

-- 기본값도 한국 날짜로
alter table public.night_study_records alter column study_date set default public.today_kst();
alter table public.fines             alter column occurred_date set default public.today_kst();
alter table public.cleaning_records  alter column cleaning_date set default public.today_kst();

-- ---------- 학생 본인 신고 ----------
create or replace function public.report_night_study(
  p_session int,
  p_status  text,
  p_reason  text
)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me    uuid := public.current_student_id();
  v_today date := public.today_kst();
  v_row   public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;

  -- isodow: 1=월 … 7=일. CIP 는 월~목만.
  if extract(isodow from v_today)::int > 4 then
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
    set status = excluded.status,
        reason = excluded.reason,
        self_reported = true,
        updated_at = now();
end;
$$;
grant execute on function public.report_night_study(int, text, text) to authenticated;

-- ---------- 전자칠판 스냅샷 ----------
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
    -- 우선순위: 당일 기록 > 학원 정기 스케줄 > 자주반 > 참석(기본값)
    -- 기록은 하루가 지나면 자동으로 사라지므로 자정에 전원 참석으로 돌아간다.
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

-- ---------- 기한 초과 2배 인상도 한국 날짜 기준 ----------
create or replace function public.apply_overdue_fines()
returns void language plpgsql security definer
set search_path = public as $$
begin
  update public.fines f
     set status = 'doubled'
   where f.deleted_at is null
     and f.status = 'unpaid'
     and f.due_date < public.today_kst()
     and (select double_fine_enabled from public.settings where id = 1);
end;
$$;
revoke all on function public.apply_overdue_fines() from public, anon, authenticated;