-- ============================================================
--  0012  —  학원 스케줄은 2·3차에만 적용
-- ============================================================
-- 학원 가는 날에도 1차는 참석하고, 2차·3차에 학원으로 빠진다.
-- 차수를 일일이 고르지 않고 요일만 지정하도록 데이터를 정리한다.

-- (학생, 요일) 마다 2차·3차 행이 있도록 보정
with base as (
  select distinct on (student_id, weekday)
         student_id, weekday, note, created_by
    from public.academy_schedules
   order by student_id, weekday, session
)
insert into public.academy_schedules (student_id, weekday, session, note, created_by)
select b.student_id, b.weekday, s.session, b.note, b.created_by
  from base b
  cross join (values (2), (3)) as s(session)
on conflict (student_id, weekday, session) do nothing;

-- 1차는 학원 대상이 아니다
delete from public.academy_schedules where session = 1;