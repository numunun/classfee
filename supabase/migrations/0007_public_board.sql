-- ============================================================
--  0007  —  전자칠판(CIP 현황판) 공개 조회 + '자주반' 상태 추가
-- ============================================================

-- ---------- '자주반'(independent) 상태 추가 ----------
alter table public.night_study_records drop constraint if exists night_study_records_status_check;
alter table public.night_study_records
  add constraint night_study_records_status_check
  check (status in ('present','independent','academy','absent','excused'));

-- ---------- 현황판 접근 코드 ----------
-- 비워두면 누구나 URL 만으로 열람 가능. 값을 넣으면 ?k=코드 가 일치해야 열람 가능.
alter table public.settings add column if not exists board_code text not null default '';

-- ---------- 공개 현황판 스냅샷 ----------
-- 로그인 없이 전자칠판에서 열기 위한 함수.
-- 이름/번호/상태만 반환하며 이메일·벌금 등 민감 정보는 절대 나가지 않는다.
create or replace function public.board_snapshot(
  p_grade int,
  p_class int,
  p_code  text default ''
)
returns table (seat_no int, name text, status text, reason text)
language plpgsql security definer
set search_path = public as $$
declare
  v_code text;
begin
  select board_code into v_code from public.settings where id = 1;

  if coalesce(v_code, '') <> '' and coalesce(p_code, '') is distinct from v_code then
    raise exception '현황판 접근 코드가 올바르지 않습니다.';
  end if;

  return query
  select
    (s.student_number % 100)::int as seat_no,
    s.name,
    coalesce(
      r.status,
      case when a.student_id is not null then 'academy' else 'unknown' end
    )::text as status,
    coalesce(r.reason, a.note)::text as reason
  from public.students s
  left join public.night_study_records r
    on r.student_id = s.id and r.study_date = current_date
  left join public.academy_schedules a
    on a.student_id = s.id
   and a.weekday = extract(isodow from current_date)::int
  where s.student_number is not null
    and s.student_number / 10000 = p_grade          -- 20935 -> 2학년
    and (s.student_number / 100) % 100 = p_class    -- 20935 -> 9반
  order by seat_no;
end;
$$;

-- 로그인하지 않은 전자칠판(anon)도 호출할 수 있어야 한다.
grant execute on function public.board_snapshot(int, int, text) to anon, authenticated;

-- 학급 이름표: 현황판 제목용 공개 조회 함수
create or replace function public.board_meta()
returns table (class_label text)
language sql security definer
set search_path = public as $$
  select class_label from public.settings where id = 1;
$$;
grant execute on function public.board_meta() to anon, authenticated;

-- ---------- 학생 본인 신고에 '자주반' 허용 (0006 함수 교체) ----------
create or replace function public.report_night_study(p_status text, p_reason text)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me  uuid := public.current_student_id();
  v_row public.night_study_records%rowtype;
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;
  if p_status not in ('present','independent','academy','absent') then
    raise exception '올바르지 않은 상태입니다.';
  end if;
  -- 참석/자주반은 사유가 필요 없고, 학원/불참은 사유가 필수다.
  if p_status in ('academy','absent')
     and (p_reason is null or length(trim(p_reason)) = 0) then
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