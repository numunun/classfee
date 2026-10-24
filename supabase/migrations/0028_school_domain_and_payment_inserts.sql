-- ============================================================
--  0028  —  학교 계정 검증을 DB 로 + 입금 신청 직접 INSERT 차단
-- ============================================================

-- ------------------------------------------------------------
-- 1) 학교 구글 계정인지 DB 에서 확인
-- ------------------------------------------------------------
-- 도메인 검증이 /auth/callback 에만 있었다. 하지만 anon key 로 Supabase Auth 에
-- 직접 로그인하면 콜백을 거치지 않고 JWT 를 받을 수 있으므로,
-- 외부 계정도 self_register 로 학생 등록이 됐다.
-- 또 이메일 가입이 켜져 있으면 아직 연결 안 된 관리자 이메일로 가입해
-- link_current_user 로 관리자 행을 가로챌 수 있었다.
-- 구글 로그인 + 학교 도메인일 때만 등록·연결을 허용한다.
--
-- 도메인이 바뀌면 여기와 NEXT_PUBLIC_SCHOOL_DOMAIN 을 함께 바꿀 것.
create or replace function public.is_school_account()
returns boolean language sql stable
set search_path = public as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'google'
     and lower(coalesce(auth.jwt() ->> 'email', '')) like '%@dshs.kr';
$$;
revoke all on function public.is_school_account() from public, anon;
grant execute on function public.is_school_account() to authenticated;

create or replace function public.link_current_user()
returns void language plpgsql security definer
set search_path = public as $$
declare v_email text;
begin
  if not public.is_school_account() then return; end if;

  v_email := lower(auth.jwt() ->> 'email');
  if v_email is null then return; end if;
  update public.students
    set auth_user_id = auth.uid()
    where lower(google_email) = v_email and auth_user_id is null;
end;
$$;
grant execute on function public.link_current_user() to authenticated;

create or replace function public.self_register(p_name text, p_student_number int)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if v_email is null then raise exception '이메일을 확인할 수 없습니다.'; end if;
  if not public.is_school_account() then
    raise exception '학교 구글 계정으로만 등록할 수 있습니다.';
  end if;

  if exists (select 1 from public.students where auth_user_id = v_uid) then
    return;
  end if;

  update public.students
     set auth_user_id = v_uid
   where lower(google_email) = v_email and auth_user_id is null;
  if found then return; end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception '이름을 입력하세요.';
  end if;
  if length(trim(p_name)) > 20 then
    raise exception '이름이 너무 깁니다.';
  end if;
  if p_student_number is null or p_student_number < 10101 or p_student_number > 69999 then
    raise exception '학번을 올바르게 입력하세요. (예: 20935)';
  end if;

  insert into public.students
    (student_number, name, google_email, role, auth_user_id, self_registered)
  values
    (p_student_number, trim(p_name), v_email, 'student', v_uid, true);
exception
  when unique_violation then
    raise exception '이미 등록된 학번이거나 계정입니다. 관리자에게 문의하세요.';
end;
$$;
grant execute on function public.self_register(text, int) to authenticated;

-- ------------------------------------------------------------
-- 2) 입금 신청은 create_payment_request() 로만
-- ------------------------------------------------------------
-- 0003 의 INSERT 정책 때문에 학생이 PostgREST 로 신청서를 직접 만들 수 있었다.
-- 금액(total_amount)을 마음대로 적을 수 있고, pri_insert 는 벌금 소유자를 확인하지 않아
-- 다른 신청에 걸린 벌금을 가짜 신청에 끼워 넣을 수도 있었다 (거절되면 그 벌금이 미납으로 돌아감).
-- RPC 는 security definer 라 정책 없이도 동작한다.
drop policy if exists pr_insert  on public.payment_requests;
drop policy if exists pri_insert on public.payment_request_items;

-- ------------------------------------------------------------
-- 확인용 (SQL Editor 에서 실행 후 결과만 보고 지워도 됨)
-- 이미 등록된 학교 밖 계정이 있는지
-- ------------------------------------------------------------
-- select student_number, name, google_email, role, self_registered
--   from public.students
--  where lower(google_email) not like '%@dshs.kr'
--  order by student_number;
