  -- ============================================================
  --  0003_rls.sql  —  행 단위 보안 (클라이언트를 절대 신뢰하지 않음)
  -- ============================================================

  alter table public.students              enable row level security;
  alter table public.settings              enable row level security;
  alter table public.fines                 enable row level security;
  alter table public.sleep_fine_details    enable row level security;
  alter table public.cleaning_records      enable row level security;
  alter table public.payment_requests      enable row level security;
  alter table public.payment_request_items enable row level security;

  -- ---------- students ----------
  -- 로그인한 사람은 명단(이름)을 볼 수 있음. 등록/수정/삭제는 관리자만.
  drop policy if exists students_select on public.students;
  create policy students_select on public.students
    for select to authenticated using (true);

  drop policy if exists students_admin_write on public.students;
  create policy students_admin_write on public.students
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
  -- (auth_user_id 연결은 link_current_user() security definer 함수가 처리 — 학생이 직접 못 바꿈)

  -- ---------- settings ----------
  drop policy if exists settings_select on public.settings;
  create policy settings_select on public.settings
    for select to authenticated using (true);

  drop policy if exists settings_admin_update on public.settings;
  create policy settings_admin_update on public.settings
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

  -- ---------- fines ----------
  -- 학생은 본인 것만(삭제 안 된 것), 관리자는 전부.
  drop policy if exists fines_select on public.fines;
  create policy fines_select on public.fines
    for select to authenticated
    using ((student_id = public.current_student_id() and deleted_at is null) or public.is_admin());

  drop policy if exists fines_admin_write on public.fines;
  create policy fines_admin_write on public.fines
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- ---------- sleep_fine_details ----------
  drop policy if exists sleep_select on public.sleep_fine_details;
  create policy sleep_select on public.sleep_fine_details
    for select to authenticated using (
      exists (select 1 from public.fines f
              where f.id = fine_id
                and ((f.student_id = public.current_student_id() and f.deleted_at is null) or public.is_admin()))
    );

  drop policy if exists sleep_admin_write on public.sleep_fine_details;
  create policy sleep_admin_write on public.sleep_fine_details
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- ---------- cleaning_records ----------
  drop policy if exists cleaning_select on public.cleaning_records;
  create policy cleaning_select on public.cleaning_records
    for select to authenticated
    using (student_id = public.current_student_id() or public.is_admin());

  drop policy if exists cleaning_admin_write on public.cleaning_records;
  create policy cleaning_admin_write on public.cleaning_records
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

  -- ---------- payment_requests ----------
  -- 학생은 본인 신청만 조회 + 생성(생성은 RPC 로). 승인/거절은 관리자만.
  drop policy if exists pr_select on public.payment_requests;

  drop policy if exists pr_insert on public.payment_requests;
  create policy pr_insert on public.payment_requests
    for insert to authenticated with check (student_id = public.current_student_id());

  drop policy if exists pr_admin_update on public.payment_requests;
  create policy pr_admin_update on public.payment_requests
    for update to authenticated using (public.is_admin()) with check (public.is_admin());

  -- ---------- payment_request_items ----------
  drop policy if exists pri_select on public.payment_request_items;

  drop policy if exists pri_insert on public.payment_request_items;
  create policy pri_insert on public.payment_request_items
    for insert to authenticated with check (
      exists (select 1 from public.payment_requests pr
              where pr.id = payment_request_id and pr.student_id = public.current_student_id())
    );
