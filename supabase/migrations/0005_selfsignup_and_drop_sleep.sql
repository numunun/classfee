-- ============================================================
--  0005  —  (1) 최초 로그인 시 학생 본인 등록  (2) 수면 벌금 폐지
-- ============================================================

-- 1) 수면 벌금 폐지 -------------------------------------------
delete from public.payment_request_items
  where fine_id in (select id from public.fines where type = 'sleep');
delete from public.fines where type = 'sleep';

drop table if exists public.sleep_fine_details;

-- 'sleep' 제거 + 'other'(기타) 추가
alter table public.fines drop constraint if exists fines_type_check;
alter table public.fines
  add constraint fines_type_check check (type in ('late','cleaning','other'));

alter table public.settings drop column if exists sleep_fine_unit;

-- 2) 학생 본인 등록 -------------------------------------------
create unique index if not exists students_student_number_key
  on public.students(student_number);

create or replace function public.self_register(p_name text, p_student_number int)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
begin
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;
  if v_email is null then raise exception '이메일을 확인할 수 없습니다'; end if;

  -- 이미 연결된 계정이면 아무 것도 하지 않음 (중복 등록 방지)
  if exists (select 1 from public.students where auth_user_id = v_uid) then
    return;
  end if;

  -- 관리자가 미리 명단에 넣어둔 경우: 새로 만들지 않고 연결만 한다.
  update public.students
     set auth_user_id = v_uid
   where lower(google_email) = v_email and auth_user_id is null;
  if found then return; end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception '이름을 입력하세요';
  end if;
  if length(trim(p_name)) > 20 then
    raise exception '이름이 너무 깁니다';
  end if;
  if p_student_number is null or p_student_number < 10101 or p_student_number > 69999 then
    raise exception '학번을 올바르게 입력하세요 (예: 20935)';
  end if;

  insert into public.students (student_number, name, google_email, role, auth_user_id)
  values (p_student_number, trim(p_name), v_email, 'student', v_uid);
exception
  when unique_violation then
    raise exception '이미 등록된 학번이거나 계정입니다. 반장에게 문의하세요';
end;
$$;
grant execute on function public.self_register(text, int) to authenticated;