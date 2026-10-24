-- ⚠️ 실제 계좌번호/이메일을 여기 적어서 커밋하지 말 것.
--    SQL Editor 에 붙여넣은 뒤 에디터 안에서만 실제 값으로 바꿔 Run.

-- 1) 최초 관리자 (RLS 때문에 첫 관리자는 SQL 로 넣어야 함)
insert into public.students (student_number, name, google_email, role) values
  (20901, '홍길동', 'CHANGE_ME_1@dshs.kr', 'admin'),
  (20902, '김철수', 'CHANGE_ME_2@dshs.kr', 'admin')
on conflict (google_email) do nothing;

-- 2) 계좌 및 금액 정책
-- collector_student_number: 입금 계좌 예금주의 학번. 이 사람만 영수증 없이 신청할 수 있다 (0021).
update public.settings set
  account_bank             = 'CHANGE_ME 은행',
  account_number           = 'CHANGE_ME 계좌번호',
  account_holder           = 'CHANGE_ME 예금주',
  collector_student_number = 20902,
  payment_deadline_days    = 7,
  double_fine_enabled      = true,
  late_fine_amount         = 1000,
  cleaning_fine_amount     = 1000
where id = 1;

-- 확인용
-- select student_number, name, role from public.students order by student_number;