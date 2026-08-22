-- ============================================================
--  0002_functions.sql  —  함수 / 트리거 (서버 측 강제 로직)
-- ============================================================

-- 현재 로그인한 사용자의 students.id (RLS 재귀 방지용 security definer)
create or replace function public.current_student_id()
returns uuid language sql security definer stable
set search_path = public as $$
  select id from public.students where auth_user_id = auth.uid() limit 1;
$$;

-- 현재 사용자가 관리자인지
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.students
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

-- 첫 로그인 시 명단(google_email)과 auth 계정 연결.
-- 이미 연결됐거나 명단에 없으면 아무 일도 안 함.
create or replace function public.link_current_user()
returns void language plpgsql security definer
set search_path = public as $$
declare v_email text;
begin
  v_email := lower(auth.jwt() ->> 'email');
  if v_email is null then return; end if;
  update public.students
    set auth_user_id = auth.uid()
    where lower(google_email) = v_email and auth_user_id is null;
end;
$$;
grant execute on function public.link_current_user() to authenticated;

-- 실제 청구 금액 (기한 초과 2배는 status='doubled' 로 표현)
create or replace function public.payable(p_amount int, p_status text)
returns int language sql immutable as $$
  select case when p_status = 'doubled' then p_amount * 2 else p_amount end;
$$;

-- 청소 불참 -> 벌금 자동 생성 / 출석 복구 시 자동 벌금 제거
create or replace function public.trg_cleaning_fine()
returns trigger language plpgsql security definer
set search_path = public as $$
declare s public.settings%rowtype; v_fine uuid;
begin
  select * into s from public.settings where id = 1;

  if NEW.attended = false then
    if NEW.linked_fine_id is null then
      insert into public.fines (student_id, type, amount, reason, occurred_date, due_date, status, created_by)
      values (NEW.student_id, 'cleaning', s.cleaning_fine_amount,
              coalesce('청소구역: ' || NEW.area, '청소 불참'),
              NEW.cleaning_date, NEW.cleaning_date + s.payment_deadline_days, 'unpaid', NEW.recorded_by)
      returning id into v_fine;
      NEW.linked_fine_id := v_fine;
    end if;
  else
    -- 출석으로 정정되면, 자동 생성됐던 미납 벌금만 소프트 삭제
    if NEW.linked_fine_id is not null then
      update public.fines
        set deleted_at = now(), delete_reason = '청소 출석으로 정정'
        where id = NEW.linked_fine_id and status in ('unpaid','doubled') and deleted_at is null;
      NEW.linked_fine_id := null;
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists cleaning_fine on public.cleaning_records;
create trigger cleaning_fine
  before insert or update of attended on public.cleaning_records
  for each row execute function public.trg_cleaning_fine();

-- 입금 신청 상태 변경 -> 연결된 벌금 일괄 처리
create or replace function public.trg_payment_status()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if NEW.status = 'approved' and OLD.status is distinct from 'approved' then
    update public.fines set status = 'paid'
      where id in (select fine_id from public.payment_request_items where payment_request_id = NEW.id)
        and status = 'pending_approval';
  elsif NEW.status = 'rejected' and OLD.status is distinct from 'rejected' then
    update public.fines set status = 'unpaid'
      where id in (select fine_id from public.payment_request_items where payment_request_id = NEW.id)
        and status = 'pending_approval';
  end if;
  return NEW;
end;
$$;
drop trigger if exists payment_status on public.payment_requests;
create trigger payment_status
  after update of status on public.payment_requests
  for each row execute function public.trg_payment_status();

-- 입금 신청 생성 (학생용). 소유권/금액을 서버가 검증·계산.
create or replace function public.create_payment_request(
  p_fine_ids uuid[], p_depositor text, p_receipt text)
returns uuid language plpgsql security definer
set search_path = public as $$
declare v_me uuid; v_total int; v_req uuid; v_fid uuid;
begin
  v_me := public.current_student_id();
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if p_depositor is null or length(trim(p_depositor)) = 0 then
    raise exception '입금자명을 입력하세요';
  end if;

  -- 본인 소유 + 미납(또는 2배) 상태인 건만 통과
  select coalesce(sum(public.payable(amount, status)), 0) into v_total
  from public.fines
  where id = any(p_fine_ids) and student_id = v_me
    and status in ('unpaid','doubled') and deleted_at is null;

  if v_total = 0 then raise exception '신청 가능한 벌금이 없습니다'; end if;

  insert into public.payment_requests (student_id, total_amount, depositor_name, receipt_photo_url)
  values (v_me, v_total, trim(p_depositor), p_receipt)
  returning id into v_req;

  foreach v_fid in array p_fine_ids loop
    if exists (select 1 from public.fines
               where id = v_fid and student_id = v_me
                 and status in ('unpaid','doubled') and deleted_at is null) then
      insert into public.payment_request_items (payment_request_id, fine_id) values (v_req, v_fid);
      update public.fines set status = 'pending_approval' where id = v_fid;
    end if;
  end loop;

  return v_req;
end;
$$;
grant execute on function public.create_payment_request(uuid[], text, text) to authenticated;

-- 기한 초과 미납 -> 2배(doubled) 전환. 매일 1회 호출 권장.
create or replace function public.apply_overdue_fines()
returns void language sql security definer
set search_path = public as $$
  update public.fines set status = 'doubled'
  where status = 'unpaid' and deleted_at is null
    and due_date < current_date
    and (select double_fine_enabled from public.settings where id = 1);
$$;

-- (선택) pg_cron 으로 매일 자동 실행하려면 Supabase 에서 pg_cron 확장 켜고 아래 실행:
-- select cron.schedule('overdue-fines', '5 0 * * *', $$ select public.apply_overdue_fines(); $$);
