-- ============================================================
--  0030  —  진단 리포트 보정
-- ============================================================
-- 1) '오늘' 을 한국 날짜로. 0015 에서 다른 함수들은 today_kst() 로 바꿨지만
--    debug_report 만 current_date(UTC) 로 남아, 한국 0~9시에는
--    「오늘 CIP 기록」이 전날 건수를 보여줬다.
-- 2) 확인 함수 목록에 0010 이후 추가된 함수들을 넣는다.
-- 3) anon 의 실행 권한을 회수한다. (함수 안에서 is_admin() 으로 막히지만 한 겹 더)
--
-- 나머지는 0010 과 같다.

create or replace function public.debug_report()
returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  v_today date := public.today_kst();
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
      'self_register','board_snapshot','board_meta','board_report','report_night_study',
      'apply_overdue_fines','create_payment_request','next_late_amount','agree_terms',
      'link_current_user','is_school_account','is_admin','current_student_id','today_kst'
    ]) f;

  select jsonb_object_agg(c.relname, c.relrowsecurity)
    into v_rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r';

  return jsonb_build_object(
    'now_utc',   to_char(now() at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    'now_seoul', to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS'),
    'today',     v_today,
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
      'ns_today',          (select count(*) from night_study_records where study_date = v_today),
      'academy',           (select count(*) from academy_schedules)
    ),
    'settings',      (select to_jsonb(s) - 'account_number' - 'board_code' from settings s where id = 1),
    'board_code_set',(select board_code <> '' from settings where id = 1),
    'unlinked_list', (select coalesce(jsonb_agg(jsonb_build_object('no', student_number, 'name', name)), '[]'::jsonb)
                        from students where auth_user_id is null)
  );
end;
$$;
revoke all on function public.debug_report() from public, anon;
grant execute on function public.debug_report() to authenticated;
