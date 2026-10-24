-- ============================================================
--  0010  —  관리자 진단 페이지(/admin/debug)용 리포트
-- ============================================================
-- 원래 SQL Editor 에서만 만들고 파일을 비워둔 채 커밋했던 것을
-- 운영 DB 의 정의(pg_get_functiondef)를 그대로 옮겨 채운다.
--
-- security definer 라 RLS 를 무시하고 전체 통계를 읽으므로
-- 함수 첫 줄에서 관리자인지 확인한다.
-- 계좌번호·현황판 코드는 settings 에서 빼고 내보낸다.

create or replace function public.debug_report()
returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  v_cron  jsonb := '[]'::jsonb;
  v_funcs jsonb;
  v_rls   jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  -- pg_cron 확장이 없을 수 있으므로 따로 감싼다
  begin
    select coalesce(
             jsonb_agg(jsonb_build_object('job', jobname, 'schedule', schedule, 'active', active)),
             '[]'::jsonb)
      into v_cron
      from cron.job;
  exception when others then
    v_cron := jsonb_build_object('unavailable', SQLERRM);
  end;

  select jsonb_object_agg(
           f,
           exists (select 1
                     from pg_proc p
                     join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = f))
    into v_funcs
    from unnest(array[
      'self_register','board_snapshot','board_meta','report_night_study',
      'apply_overdue_fines','create_payment_request','link_current_user',
      'is_admin','current_student_id'
    ]) f;

  select jsonb_object_agg(c.relname, c.relrowsecurity)
    into v_rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r';

  return jsonb_build_object(
    'now_utc',   to_char(now() at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    'now_seoul', to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS'),
    'today',     current_date,
    'functions', v_funcs,
    'rls',       v_rls,
    'cron',      v_cron,
    'counts', jsonb_build_object(
      'students',          (select count(*) from students),
      'students_unlinked', (select count(*) from students where auth_user_id is null),
      'students_self',     (select count(*) from students where self_registered),
      'admins',            (select count(*) from students where role = 'admin'),
      'independent',       (select count(*) from students where is_independent),
      'fines',             (select count(*) from fines where deleted_at is null),
      'fines_unpaid',      (select count(*) from fines where deleted_at is null and status in ('unpaid','doubled')),
      'fines_deleted',     (select count(*) from fines where deleted_at is not null),
      'payment_pending',   (select count(*) from payment_requests where status = 'pending'),
      'ns_today',          (select count(*) from night_study_records where study_date = current_date),
      'academy',           (select count(*) from academy_schedules)
    ),
    'settings',      (select to_jsonb(s) - 'account_number' - 'board_code' from settings s where id = 1),
    'board_code_set',(select board_code <> '' from settings where id = 1),
    'unlinked_list', (select coalesce(jsonb_agg(jsonb_build_object('no', student_number, 'name', name)), '[]'::jsonb)
                        from students where auth_user_id is null)
  );
end;
$$;
grant execute on function public.debug_report() to authenticated;
