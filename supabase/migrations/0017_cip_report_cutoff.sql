-- ============================================================
--  0017  —  CIP 신고 마감 (3차 종료 21:00 이후 잠금)
-- ============================================================
-- 화면에서 막아도 rpc 를 직접 호출할 수 있으므로 DB 에서도 막는다.

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
  v_min   int  := extract(hour from (now() at time zone 'Asia/Seoul'))::int * 60
                + extract(minute from (now() at time zone 'Asia/Seoul'))::int;
  v_row   public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;

  -- isodow: 1=월 … 7=일. CIP 는 월~목만.
  if extract(isodow from v_today)::int > 4 then
    raise exception '오늘은 CIP 운영일이 아닙니다.';
  end if;

  -- 3차 종료(21:00) 이후에는 그날 기록을 바꿀 수 없다.
  if v_min >= 21 * 60 then
    raise exception '오늘 CIP 신고가 마감됐습니다. 관리자에게 문의하세요.';
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