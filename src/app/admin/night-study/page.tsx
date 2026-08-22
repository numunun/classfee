import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NightStudyAdmin, type Row } from "@/components/NightStudyAdmin";
import { todayISO, SESSIONS, type NightStatus } from "@/lib/night-study";

export const dynamic = "force-dynamic";

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
  session: number;
  weekday: number;
};

export default async function NightStudyPage() {
  const supabase = createClient();
  const today = todayISO();

  const [{ data: studentsData }, { data: recordsData }, { data: acaData }] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, student_number, is_independent")
      .order("student_number"),
    supabase
      .from("night_study_records")
      .select("student_id, session, status, reason, self_reported")
      .eq("study_date", today),
    supabase.from("academy_schedules").select("student_id, session, weekday"),
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

  // student_id -> session -> 학원 요일 목록
  const acaMap = new Map<string, Record<number, number[]>>();
  for (const a of academies) {
    const cur = acaMap.get(a.student_id) ?? {};
    cur[a.session] = [...(cur[a.session] ?? []), a.weekday];
    acaMap.set(a.student_id, cur);
  }

  const rows: Row[] = students.map((s) => {
    const academy: Record<number, number[]> = {};
    for (const n of SESSIONS) {
      academy[n] = acaMap.get(s.id)?.[n] ?? [];
    }
    return {
      id: s.id,
      name: s.name,
      student_number: s.student_number,
      isIndependent: !!s.is_independent,
      states: recMap.get(s.id) ?? {},
      academy,
    };
  });

  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">
        ← 대시보드
      </Link>
      <div className="mb-4 mt-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">🌙 CIP 관리</h1>
        <Link
          href="/board/2/9"
          target="_blank"
          className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-neutral-300"
        >
          전자칠판 열기 ↗
        </Link>
      </div>
      <NightStudyAdmin rows={rows} date={today} />
    </>
  );
}