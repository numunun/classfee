-- ============================================================
--  0031  —  전자칠판에 「관리자 처리」 잠금 여부 내보내기
-- ============================================================
-- 관리자가 지정한 기록(self_reported = false)은 board_report 가 이미 거절한다 (0024·0026).
-- 하지만 현황판은 그 칸이 잠겼는지 몰라서, 눌러서 상태를 고른 뒤에야 에러가 떴다.
-- locked 열을 함께 내보내 현황판이 처음부터 잠금 표시를 하고 누르지 못하게 한다.
--
-- 반환 열이 바뀌므로 create or replace 로는 안 되고 지운 뒤 다시 만든다.
-- 나머지(우선순위·사유 규칙)는 0025 와 같다.

drop function if exists public.board_snapshot(int, int, int, text);

create function public.board_snapshot(
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
  is_independent bool,
  locked         bool
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
    s.is_independent,
    -- 관리자가 처리한 칸은 전자칠판에서 바꿀 수 없다 (board_report 와 같은 기준)
    coalesce(r.id is not null and r.self_reported = false, false) as locked
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
