-- ============================================================
--  0029  —  영수증 경로 검증 + 지각 누진 금액 오버플로 수정
-- ============================================================

-- ------------------------------------------------------------
-- 1) 입금 신청의 영수증은 본인이 올린 실제 파일이어야 한다
-- ------------------------------------------------------------
-- p_receipt 를 검사하지 않아 아무 경로나 넣을 수 있었다.
-- (다른 학생 폴더의 경로를 넣으면 관리자 화면에 남의 영수증이 떠 버린다)
-- 본인 폴더({auth.uid}/…)에 실제로 올라간 파일만 받는다.
-- 나머지는 0021 과 같다.
create or replace function public.create_payment_request(
  p_fine_ids uuid[], p_depositor text, p_receipt text)
returns uuid language plpgsql security definer
set search_path = public as $$
declare
  v_me uuid; v_total int; v_req uuid; v_fid uuid;
  v_my_number int; v_collector int;
  v_receipt text := nullif(trim(coalesce(p_receipt, '')), '');
begin
  v_me := public.current_student_id();
  if v_me is null then raise exception '로그인이 필요합니다'; end if;
  if p_depositor is null or length(trim(p_depositor)) = 0 then
    raise exception '입금자명을 입력하세요';
  end if;

  -- 예금주 본인만 영수증을 생략할 수 있다.
  select student_number into v_my_number from public.students where id = v_me;
  select collector_student_number into v_collector from public.settings where id = 1;

  if v_receipt is null then
    if v_my_number is distinct from v_collector then
      raise exception '입금 완료 화면 사진을 첨부하세요';
    end if;
  elsif not exists (
    select 1 from storage.objects o
     where o.bucket_id = 'receipts'
       and o.name = v_receipt
       and (storage.foldername(o.name))[1] = auth.uid()::text
  ) then
    raise exception '첨부한 사진을 찾을 수 없어요. 다시 올려주세요';
  end if;

  -- 본인 소유 + 미납(또는 2배) 상태인 건만 통과
  select coalesce(sum(public.payable(amount, status)), 0) into v_total
  from public.fines
  where id = any(p_fine_ids) and student_id = v_me
    and status in ('unpaid','doubled') and deleted_at is null;

  if v_total = 0 then raise exception '신청 가능한 벌금이 없습니다'; end if;

  insert into public.payment_requests (student_id, total_amount, depositor_name, receipt_photo_url)
  values (v_me, v_total, trim(p_depositor), v_receipt)
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

-- ------------------------------------------------------------
-- 2) 지각 누진 금액: 상한을 먼저 적용한 뒤 int 로 바꾼다
-- ------------------------------------------------------------
-- 0022 는 (1000 × 2^n)::int 를 먼저 계산해서, 지각이 21회를 넘으면
-- int 범위를 벗어나 벌금 부과 자체가 에러로 실패했다.
create or replace function public.next_late_amount(p_student uuid)
returns int language plpgsql stable
set search_path = public as $$
declare
  v_base  int;
  v_cap   int;
  v_start date;
  v_count int;
begin
  select late_fine_amount, late_fine_cap, late_policy_start
    into v_base, v_cap, v_start
    from public.settings where id = 1;

  if v_start is null then return v_base; end if;

  select count(*) into v_count
    from public.fines
   where student_id = p_student
     and type = 'late'
     and deleted_at is null
     and occurred_date >= v_start;

  return least(v_base * power(2::numeric, v_count), v_cap)::int;
end;
$$;
grant execute on function public.next_late_amount(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3) HEIC 업로드 차단
-- ------------------------------------------------------------
-- 관리자 브라우저(크롬)가 HEIC 를 표시하지 못한다.
-- 화면에서는 JPEG 로 바꿔 올리므로 저장소에서도 받지 않는다.
update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id in ('receipts','evidence');
