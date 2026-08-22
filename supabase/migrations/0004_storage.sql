-- ============================================================
--  0004_storage.sql  —  사진 저장소 (증거 사진 / 입금 영수증)
-- ============================================================

-- evidence: 수면 벌금 증거 사진 (관리자가 업로드)
insert into storage.buckets (id, name, public) values ('evidence','evidence', false)
on conflict (id) do nothing;

-- receipts: 입금 완료 영수증 (학생이 업로드)
insert into storage.buckets (id, name, public) values ('receipts','receipts', false)
on conflict (id) do nothing;

-- evidence: 관리자만 업로드/조회/삭제
drop policy if exists evidence_admin_all on storage.objects;
create policy evidence_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'evidence' and public.is_admin())
  with check (bucket_id = 'evidence' and public.is_admin());

-- receipts: 학생은 본인 폴더(이메일/uid)에 업로드, 본인 것 조회. 관리자는 전부 조회.
-- 업로드 경로 규칙: receipts/{auth.uid}/파일명
drop policy if exists receipts_owner_insert on storage.objects;
create policy receipts_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists receipts_select on storage.objects;
create policy receipts_select on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 비공개 버킷이므로 화면에서는 createSignedUrl() 로 임시 URL 을 만들어 표시한다.
