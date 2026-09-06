-- ============================================================
--  0019  —  약관 동의 기록
-- ============================================================
-- 이미 가입한 학생도 다음 접속 때 동의를 받아야 하므로
-- 온보딩이 아니라 별도 컬럼으로 관리한다.

alter table public.students
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists terms_version   text;

-- 본인만 자신의 동의 사실을 기록할 수 있다.
create or replace function public.agree_terms(p_version text)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_me uuid := public.current_student_id();
begin
  if v_me is null then raise exception '로그인이 필요합니다.'; end if;
  if p_version is null or length(trim(p_version)) = 0 then
    raise exception '약관 버전이 없습니다.';
  end if;

  update public.students
     set terms_agreed_at = now(),
         terms_version   = p_version
   where id = v_me;
end;
$$;
grant execute on function public.agree_terms(text) to authenticated;