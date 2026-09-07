-- ============================================================
--  0021  —  입금 계좌 예금주는 영수증 없이 신청 가능
-- ============================================================
-- 벌금이 부반장(예금주) 계좌로 모이므로, 부반장 본인은 자기 계좌에
-- 입금할 일이 없어 영수증(입금 화면 사진)을 낼 수 없다.
-- 예금주 학번을 설정에 두어, 그 사람만 영수증 없이 신청하게 한다.

alter table public.settings
  add column if not exists collector_student_number int;

-- 부반장(전은찬) 학번을 기본값으로 넣어둔다. 바뀌면 설정에서 수정.
update public.settings set collector_student_number = 20930 where id = 1;

create or replace function public.create_payment_request(
  p_fine_ids uuid[], p_depositor text, p_receipt text)
returns uuid language plpgsql security definer
set search_path = public as $$
declare
  v_me uuid; v_total int; v_req uuid; v_fid uuid;
  v_my_number int; v_collector int;
begin
  v_me := public.current_student_id();
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if p_depositor is null or length(trim(p_depositor)) = 0 then
    raise exception '입금자명을 입력하세요';
  end if;

  -- 예금주 본인만 영수증을 생략할 수 있다.
  select student_number into v_my_number from public.students where id = v_me;
  select collector_student_number into v_collector from public.settings where id = 1;

  if p_receipt is null or length(trim(p_receipt)) = 0 then
    if v_my_number is distinct from v_collector then
      raise exception '입금 완료 화면 사진을 첨부하세요';
    end if;
  end if;

  -- 본인 소유 + 미납(또는 2배) 상태인 건만 통과
  select coalesce(sum(public.payable(amount, status)), 0) into v_total
  from public.fines
  where id = any(p_fine_ids) and student_id = v_me
    and status in ('unpaid','doubled') and deleted_at is null;

  if v_total = 0 then raise exception '신청 가능한 벌금이 없습니다'; end if;

  insert into public.payment_requests (student_id, total_amount, depositor_name, receipt_photo_url)
  values (v_me, v_total, trim(p_depositor), nullif(trim(coalesce(p_receipt,'')), ''))
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