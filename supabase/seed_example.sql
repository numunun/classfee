-- ⚠️ 실제 계좌번호/이메일을 여기 적어서 커밋하지 말 것.
--    SQL Editor 에 붙여넣은 뒤 에디터 안에서만 실제 값으로 바꿔 Run.

-- 1) 최초 관리자 (RLS 때문에 첫 관리자는 SQL 로 넣어야 함)
insert into public.students (student_number, name, google_email, role) values
  (20935, '황성재', '25_hsj0325@dshs.kr', 'admin'),   -- 법무부장
  (20930, '전은찬', '25_jec0623@dshs.kr', 'admin')
on conflict (google_email) do nothing;

-- 2) 계좌 및 금액 정책
update public.settings set
  account_bank          = 'CHANGE_ME 은행',
  account_number        = 'CHANGE_ME 계좌번호',
  account_holder        = 'CHANGE_ME 예금주',
  payment_deadline_days = 7,
  double_fine_enabled   = true,
  sleep_fine_unit       = 1000,
  late_fine_amount      = 1000,
  cleaning_fine_amount  = 1000
where id = 1;

-- 확인용
-- select student_number, name, role from public.students order by student_number;