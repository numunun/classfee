import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NightStudyAdmin, type Row } from "@/components/NightStudyAdmin";
import { todayISO, weekdayIndex, isCipDay, type NightStatus } from "@/lib/night-study";

export const dynamic = "force-dynamic";
export const metadata = { title: "CIP 관리" };

type StudentRow = {
  id: string;
  name: string;
  student_number: number | null;
  is_independent: boolean;
};

type RecordRow = {
  student_id: string;
  session: number;
  status: NightStatus;
  reason: string | null;
  self_reported: boolean;
};

type AcademyRow = {
  student_id: string;
  weekday: number;
};

export default async function NightStudyPage() {
  const supabase = createClient();
  const today = todayISO();
  const wd = weekdayIndex();

  const [{ data: studentsData }, { data: recordsData }, { data: acaData }] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, student_number, is_independent")
      .order("student_number"),
    supabase
      .from("night_study_records")
      .select("student_id, session, status, reason, self_reported")
      .eq("study_date", today),
    supabase.from("academy_schedules").select("student_id, weekday"),
  ]);

  const students = (studentsData ?? []) as StudentRow[];
  const records = (recordsData ?? []) as RecordRow[];
  const academies = (acaData ?? []) as AcademyRow[];

  // student_id -> session -> 오늘 상태
  const recMap = new Map<string, Row["states"]>();
  for (const r of records) {
    const cur = recMap.get(r.student_id) ?? {};
    cur[r.session] = {
      status: r.status,
      reason: r.reason,
      selfReported: r.self_reported,
    };
    recMap.set(r.student_id, cur);
  }

  // student_id -> 학원 가는 요일 목록 (차수는 2·3차로 고정이라 요일만 모은다)
  const acaMap = new Map<string, number[]>();
  for (const a of academies) {
    const cur = acaMap.get(a.student_id) ?? [];
    if (!cur.includes(a.weekday)) cur.push(a.weekday);
    acaMap.set(a.student_id, cur);
  }

  const rows: Row[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    student_number: s.student_number,
    isIndependent: !!s.is_independent,
    states: recMap.get(s.id) ?? {},
    academyDays: (acaMap.get(s.id) ?? []).sort(),
  }));

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">
        ← 대시보드
      </Link>
      <div className="mb-4 mt-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">🌙 CIP 관리</h1>
        <Link
          href="/board/2/9/legacy"
          target="_blank"
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-neutral-300"
        >
          전자칠판 열기 ↗
        </Link>
      </div>

      {!isCipDay(wd) && (
        <div className="mb-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-xs text-neutral-400">
          오늘은 CIP 운영일이 아니에요. (월~목만 운영) 기록은 남길 수 있지만 학생은 신고할 수 없어요.
        </div>
      )}

      <NightStudyAdmin rows={rows} date={today} weekday={wd} />
    </>
  );
}