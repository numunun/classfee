-- ============================================================
--  0024  —  전자칠판에서 CIP 직접 수정
-- ============================================================
-- 교실 전자칠판은 로그인 없이 쓰므로 본인 확인이 불가능하다.
-- 다음 날 교사·학생 간 교차검증이 이루어지는 전제 하에 허용하되,
-- 전자칠판에서 바뀐 기록임을 표시해 추적할 수 있게 한다.

alter table public.night_study_records
  add column if not exists via_board bool not null default false;

/**
 * 전자칠판용 CIP 신고.
 * 좌석 번호로 학생을 찾으므로 로그인이 필요 없다.
 * 접근 코드(board_code)가 설정돼 있으면 일치해야 한다.
 */
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
  v_code   text;
  v_today  date := public.today_kst();
  v_min    int  := extract(hour from (now() at time zone 'Asia/Seoul'))::int * 60
                 + extract(minute from (now() at time zone 'Asia/Seoul'))::int;
  v_me     uuid;
  v_row    public.night_study_records%rowtype;
begin
  select board_code into v_code from public.settings where id = 1;
  if coalesce(v_code, '') <> '' and coalesce(p_code, '') is distinct from v_code then
    raise exception '현황판 접근 코드가 올바르지 않습니다.';
  end if;

  if extract(isodow from v_today)::int > 4 then
    raise exception '오늘은 CIP 운영일이 아닙니다.';
  end if;
  if v_min >= 21 * 60 then
    raise exception '오늘 CIP 신고가 마감됐습니다.';
  end if;
  if p_session is null or p_session < 1 or p_session > 3 then
    raise exception '올바르지 않은 차수입니다.';
  end if;
  if p_status not in ('present','academy','hospital','special','other') then
    raise exception '올바르지 않은 상태입니다.';
  end if;

  -- 좌석 번호로 학생 찾기 (학번 = 학년2자리 + 반2자리 + 번호2자리)
  select id into v_me from public.students
   where student_number = p_grade * 10000 + p_class * 100 + p_seat;
  if v_me is null then raise exception '해당 번호의 학생을 찾을 수 없습니다.'; end if;

  -- 관리자가 이미 처리한 기록은 전자칠판에서 덮어쓸 수 없다
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