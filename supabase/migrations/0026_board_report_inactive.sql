-- ============================================================
--  0026  —  전자칠판 수정에서 CIP 비활성 학생 막기
-- ============================================================
-- 0025 에서 report_night_study(학생 본인 신고)는 비활성 학생을 막았지만
-- board_report(전자칠판 수정)는 막지 않았다.
-- 그래서 전자칠판에서 비활성 학생 카드를 눌러 「학원」 등을 고르면
--   1) 저장은 성공하고 (self_reported = true, via_board = true)
--   2) 화면은 낙관적 갱신으로 잠깐 「학원」이 됐다가
--   3) 다음 폴링 때 board_snapshot 이 비활성화를 우선해 다시 「비활성화」로 돌아갔다.
-- 쓸모없는 기록만 쌓이고 화면이 깜빡이므로 저장 단계에서 거절한다.
--
-- 시그니처·반환형은 0024 와 같으므로 create or replace 로 덮어쓴다.

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
  v_me       uuid;
  v_inactive bool;
  v_row      public.night_study_records%rowtype;
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

  -- 좌석 번호로 학생 찾기 (학번 = 학년 + 반2자리 + 번호2자리)
  select id, cip_inactive into v_me, v_inactive
    from public.students
   where student_number = p_grade * 10000 + p_class * 100 + p_seat;
  if v_me is null then raise exception '해당 번호의 학생을 찾을 수 없습니다.'; end if;

  -- CIP 비활성 학생은 전자칠판에서 바꿀 수 없다 (관리자 화면에서만 지정 가능)
  if coalesce(v_inactive, false) then
    raise exception 'CIP 참여 대상이 아닌 학생입니다. 관리자에게 문의하세요.';
  end if;

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

-- ------------------------------------------------------------
-- 확인용 (SQL Editor 에서 실행 후 결과만 보고 지워도 됨)
-- 비활성 학생과, 그 학생에게 남아 있는 오늘 기록
-- ------------------------------------------------------------
-- select s.student_number, s.name, s.cip_inactive,
--        r.session, r.status, r.self_reported, r.via_board
--   from public.students s
--   left join public.night_study_records r
--     on r.student_id = s.id and r.study_date = public.today_kst()
--  where s.cip_inactive
--  order by s.student_number, r.session;