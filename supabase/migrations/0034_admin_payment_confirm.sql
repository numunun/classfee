-- ============================================================
--  0034  —  입금 확인을 관리자가 하도록 (학생 입금 신청 폐지)
-- ============================================================
-- 예전: 학생이 입금 화면 사진을 붙여 「입금 완료 신청」 → 관리자가 승인.
-- 이제: 학생은 계좌로 입금만 한다. 관리자가 통장 입금 내역 스크린샷을 붙여
--       받은 벌금을 골라 「입금 확인」하면 바로 완납 처리된다.
--
-- 기록은 예전과 같은 payment_requests / payment_request_items 에 「승인됨」 상태로 남긴다.
-- 그래야 입금 처리 내역·회계 보고서가 그대로 이어진다.
-- (reviewed_by = 확인한 관리자, receipt_photo_url = 관리자가 올린 스크린샷)

create or replace function public.confirm_payment(
  p_student   uuid,
  p_fine_ids  uuid[],
  p_receipt   text,
  p_depositor text default null
)
returns uuid language plpgsql security definer
set search_path = public as $$
declare
  v_me      uuid := public.current_student_id();
  v_name    text;
  v_total   int;
  v_req     uuid;
  v_receipt text := nullif(trim(coalesce(p_receipt, '')), '');
begin
  if v_me is null or not public.is_admin() then
    raise exception '관리자만 입금을 확인할 수 있습니다.';
  end if;

  -- 나중에 통장 내역과 대조할 수 있도록 스크린샷은 필수
  if v_receipt is null then
    raise exception '입금 내역 스크린샷을 첨부하세요.';
  end if;
  if not exists (
    select 1 from storage.objects o
     where o.bucket_id = 'receipts'
       and o.name = v_receipt
       and (storage.foldername(o.name))[1] = auth.uid()::text
  ) then
    raise exception '첨부한 스크린샷을 찾을 수 없어요. 다시 올려주세요.';
  end if;

  select name into v_name from public.students where id = p_student;
  if v_name is null then raise exception '학생을 찾을 수 없습니다.'; end if;

  -- 그 학생의 미납(또는 2배) 건만 통과
  select coalesce(sum(public.payable(amount, status)), 0) into v_total
    from public.fines
   where id = any(p_fine_ids) and student_id = p_student
     and status in ('unpaid', 'doubled') and deleted_at is null;
  if v_total = 0 then raise exception '확인할 미납 벌금이 없습니다.'; end if;

  insert into public.payment_requests
    (student_id, total_amount, depositor_name, receipt_photo_url, status, reviewed_by, reviewed_at)
  values
    (p_student, v_total, coalesce(nullif(trim(p_depositor), ''), v_name), v_receipt,
     'approved', v_me, now())
  returning id into v_req;

  insert into public.payment_request_items (payment_request_id, fine_id)
  select v_req, f.id
    from public.fines f
   where f.id = any(p_fine_ids) and f.student_id = p_student
     and f.status in ('unpaid', 'doubled') and f.deleted_at is null;

  update public.fines set status = 'paid'
   where id in (select fine_id from public.payment_request_items where payment_request_id = v_req);

  return v_req;
end;
$$;
revoke all on function public.confirm_payment(uuid, uuid[], text, text) from public, anon;
grant execute on function public.confirm_payment(uuid, uuid[], text, text) to authenticated;

-- 학생 입금 신청은 더 이상 받지 않는다. 함수는 예전 기록 이해용으로 남기고 실행 권한만 회수한다.
revoke execute on function public.create_payment_request(uuid[], text, text) from public, anon, authenticated;
