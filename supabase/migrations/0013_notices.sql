-- ============================================================
--  0013  —  학급 공지
-- ============================================================

create table if not exists public.notices (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  is_active  bool not null default true,
  created_by uuid references public.students(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notices_active
  on public.notices(is_active, created_at desc);

alter table public.notices enable row level security;

-- 학생은 게시 중인 공지만, 관리자는 내려둔 것까지 본다.
drop policy if exists notices_select on public.notices;
create policy notices_select on public.notices
  for select to authenticated
  using (is_active or public.is_admin());

drop policy if exists notices_admin_write on public.notices;
create policy notices_admin_write on public.notices
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());