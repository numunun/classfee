-- ============================================================
--  0009  —  보안 보강
-- ============================================================

-- ------------------------------------------------------------
-- 1) apply_overdue_fines() 를 아무나 호출하지 못하게 막는다
-- ------------------------------------------------------------
-- Postgres 는 함수 생성 시 EXECUTE 를 PUBLIC 에 자동으로 준다.
-- 이 함수는 security definer 라 RLS 를 무시하므로, 학생이 rpc 로 직접 호출하면
-- 전교생 미납 벌금을 임의 시점에 2배로 만들 수 있었다. cron 만 쓰도록 회수한다.
revoke all on function public.apply_overdue_fines() from public;
revoke all on function public.apply_overdue_fines() from anon;
revoke all on function public.apply_overdue_fines() from authenticated;

-- ------------------------------------------------------------
-- 2) 학생 명단 전체 열람 차단
-- ------------------------------------------------------------
-- 기존 정책은 로그인한 누구나 students 전체를 읽을 수 있었다.
-- 이름뿐 아니라 google_email / auth_user_id / role 까지 노출됐다.
-- 학생 화면은 본인 행만 필요하고, 명단이 필요한 화면은 전부 관리자 전용이다.
-- (전자칠판은 board_snapshot() security definer 로 이름·번호만 따로 내보낸다.)
drop policy if exists students_select on public.students;
create policy students_select on public.students
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
-- 3) 관리자가 본인 입금 신청을 스스로 승인하지 못하게
-- ------------------------------------------------------------
-- 반장·부반장·법무부장도 학생이라 본인 벌금이 있고, 실제 현금이 오간다.
-- 자기 신청은 다른 관리자가 확인하도록 강제한다.
drop policy if exists pr_admin_update on public.payment_requests;
create policy pr_admin_update on public.payment_requests
  for update to authenticated
  using (public.is_admin() and student_id <> public.current_student_id())
  with check (public.is_admin() and student_id <> public.current_student_id());

-- ------------------------------------------------------------
-- 4) 자기등록 여부 기록
-- ------------------------------------------------------------
-- 학생이 이름·학번을 스스로 입력하므로 도용/오기입을 관리자가 확인할 수 있어야 한다.
alter table public.students add column if not exists self_registered bool not null default false;

create or replace function public.self_register(p_name text, p_student_number int)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  if v_email is null then raise exception '이메일을 확인할 수 없습니다.'; end if;

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
-- 5) 업로드 파일 제한
-- ------------------------------------------------------------
-- 크기·형식 제한이 없으면 대용량 파일이나 임의 형식(html 등)을 올릴 수 있다.
update storage.buckets
   set file_size_limit = 5242880,   -- 5MB
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic']
 where id in ('receipts','evidence');