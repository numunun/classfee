-- ============================================================
--  0018  —  점검 모드
-- ============================================================
-- 관리자가 토글하면 모든 화면 맨 위에 안내 배너가 뜬다.

alter table public.settings
  add column if not exists maintenance_on   bool not null default false,
  add column if not exists maintenance_text text;