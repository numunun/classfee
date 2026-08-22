-- ============================================================
--  0001_schema.sql  —  테이블 정의
-- ============================================================

-- 학생/관리자 명단. 로그인 전에 admin 이 미리 등록해 둔다.
-- auth_user_id 는 학생의 첫 구글 로그인 시 link_current_user() 가 채운다.
create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  student_number int,
  name           text not null,
  google_email   text not null unique,
  role           text not null default 'student' check (role in ('student','admin')),
  auth_user_id   uuid unique references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- 전역 설정 (단일 행, id=1)
create table if not exists public.settings (
  id                    int primary key default 1,
  payment_deadline_days int  not null default 7,
  double_fine_enabled   bool not null default true,
  account_bank          text default '',
  account_number        text default '',
  account_holder        text default '',
  sleep_fine_unit       int  not null default 1000,   -- 수면: 교시당 금액
  late_fine_amount      int  not null default 1000,   -- 지각: 건당 금액
  cleaning_fine_amount  int  not null default 1000    -- 청소 불참: 건당 금액
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- 벌금 본체 (모든 종류 공통)
create table if not exists public.fines (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students(id) on delete cascade,
  type          text not null check (type in ('sleep','late','cleaning')),
  amount        int  not null default 0,        -- 원금 (2배는 status 로 표현, 금액은 보존)
  reason        text,
  occurred_date date not null default current_date,
  due_date      date not null,
  status        text not null default 'unpaid'
                  check (status in ('unpaid','pending_approval','paid','doubled')),
  created_by    uuid references public.students(id),
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,                    -- 소프트 삭제
  deleted_by    uuid references public.students(id),
  delete_reason text
);
create index if not exists idx_fines_student on public.fines(student_id);
create index if not exists idx_fines_status  on public.fines(status);

-- 수면 벌금 상세 (type='sleep' 일 때만, fines 와 1:1)
create table if not exists public.sleep_fine_details (
  id                 uuid primary key default gen_random_uuid(),
  fine_id            uuid not null unique references public.fines(id) on delete cascade,
  periods            int[] not null default '{}',   -- 잠든 교시들 (예: {1,4})
  sleep_count        int  not null default 1,        -- 잠든 횟수
  evidence_photo_url text
);

-- 청소 출결 전체 기록
create table if not exists public.cleaning_records (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  cleaning_date  date not null default current_date,
  area           text,
  attended       bool not null default true,
  recorded_by    uuid references public.students(id),
  linked_fine_id uuid references public.fines(id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (student_id, cleaning_date, area)
);

-- 입금 신청 묶음 (학생이 여러 벌금을 한 번에 신청)
create table if not exists public.payment_requests (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.students(id) on delete cascade,
  total_amount     int  not null default 0,    -- 서버가 계산 (학생 입력 금지)
  depositor_name   text not null,
  receipt_photo_url text,
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected')),
  reviewed_by      uuid references public.students(id),
  reviewed_at      timestamptz,
  reject_reason    text,
  requested_at     timestamptz not null default now()
);

-- 신청 ↔ 벌금 연결
create table if not exists public.payment_request_items (
  id                 uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  fine_id            uuid not null references public.fines(id) on delete cascade,
  unique (payment_request_id, fine_id)
);
