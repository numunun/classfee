drop policy if exists pr_select on public.payment_requests;
create policy pr_select on public.payment_requests
  for select to authenticated
  using (student_id = public.current_student_id() or public.is_admin());

drop policy if exists pri_select on public.payment_request_items;
create policy pri_select on public.payment_request_items
  for select to authenticated
  using (exists (
    select 1 from public.payment_requests pr
    where pr.id = payment_request_id
      and (pr.student_id = public.current_student_id() or public.is_admin())
  ));