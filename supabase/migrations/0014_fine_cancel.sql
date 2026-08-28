-- ============================================================
--  0014  —  벌금 '삭제'를 '취소'로
-- ============================================================
-- 기록은 원래부터 소프트 삭제(deleted_at)로 보존돼 있었지만,
-- 학생 화면에서는 아예 사라져서 "왜 없어졌지?" 를 알 수 없었다.
-- 취소된 건도 학생이 볼 수 있게 열어준다.

drop policy if exists fines_select on public.fines;
create policy fines_select on public.fines
  for select to authenticated
  using (student_id = public.current_student_id() or public.is_admin());