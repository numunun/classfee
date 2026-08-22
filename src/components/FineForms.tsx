"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSleepFine, createLateFine } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";
import { won, type Student } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

export function FineForms({
  students,
  sleepUnit,
  lateAmount,
}: {
  students: Pick<Student, "id" | "name" | "student_number">[];
  sleepUnit: number;
  lateAmount: number;
}) {
  const [tab, setTab] = useState<"sleep" | "late">("sleep");
  return (
    <>
      <div className="mb-4 flex gap-2">
        <Tab active={tab === "sleep"} onClick={() => setTab("sleep")}>🌙 수면</Tab>
        <Tab active={tab === "late"} onClick={() => setTab("late")}>⏰ 지각</Tab>
      </div>
      {tab === "sleep" ? (
        <SleepForm students={students} sleepUnit={sleepUnit} />
      ) : (
        <LateForm students={students} lateAmount={lateAmount} />
      )}
      <p className="mt-4 text-center text-xs text-neutral-500">
        청소 불참 벌금은 <a href="/admin/cleaning" className="text-blue-400">청소 현황</a>에서 자동 처리돼요.
      </p>
    </>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium ${
        active ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function StudentSelect({ students }: { students: { id: string; name: string; student_number: number | null }[] }) {
  return (
    <div>
      <label>학생 선택</label>
      <select name="studentId" defaultValue="" required className="mt-1.5">
        <option value="" disabled>학생을 선택하세요</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.student_number ? `${s.student_number} ` : ""}{s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function SleepForm({
  students,
  sleepUnit,
}: {
  students: { id: string; name: string; student_number: number | null }[];
  sleepUnit: number;
}) {
  const [periods, setPeriods] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const router = useRouter();
  const amount = periods.length * sleepUnit;

  function toggle(p: number) {
    setPeriods((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setPending(true);
        try {
          await createSleepFine(fd);
          formRef.current?.reset();
          setPeriods([]);
          toast("수면 벌금을 부과했어요.");
          router.push("/admin");
        } catch (e) {
          toast((e as Error).message, "error");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4 rounded-2xl bg-surface p-5"
    >
      <h2 className="flex items-center gap-2 font-semibold">🌙 수면 벌금 부과</h2>
      <StudentSelect students={students} />

      <div>
        <label>날짜</label>
        <input type="date" name="occurredDate" defaultValue={today()} className="mt-1.5" />
      </div>

      <div>
        <label>잠든 교시 (복수 선택 가능)</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => toggle(p)}
              className={`size-11 rounded-xl text-sm font-medium ${
                periods.includes(p) ? "bg-blue-900/60 text-blue-300 ring-1 ring-blue-500" : "bg-surface-2"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {periods.map((p) => (
          <input key={p} type="hidden" name="periods" value={p} />
        ))}
      </div>

      <div>
        <label>잠든 횟수</label>
        <input type="number" name="sleepCount" min={1} defaultValue={1} className="mt-1.5 w-28" />
      </div>

      <div>
        <label>증거 사진 (필수)</label>
        <input type="file" name="photo" accept="image/*" capture="environment" required className="mt-1.5" />
      </div>

      <div className="rounded-xl bg-surface-2 p-3">
        <p className="text-xs text-neutral-500">벌금액 (교시당 자동 계산)</p>
        <p className="mt-0.5 text-xl font-semibold">
          {won(amount)}{" "}
          <span className="text-xs font-normal text-neutral-500">
            {periods.length}교시 × {won(sleepUnit)}
          </span>
        </p>
      </div>

      <button
        disabled={pending || periods.length === 0}
        className="w-full rounded-xl bg-white py-3 font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "부과 중…" : "벌금 부과하기"}
      </button>
    </form>
  );
}

function LateForm({
  students,
  lateAmount,
}: {
  students: { id: string; name: string; student_number: number | null }[];
  lateAmount: number;
}) {
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setPending(true);
        try {
          await createLateFine(fd);
          formRef.current?.reset();
          toast("지각 벌금을 부과했어요.");
          router.push("/admin");
        } catch (e) {
          toast((e as Error).message, "error");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4 rounded-2xl bg-surface p-5"
    >
      <h2 className="flex items-center gap-2 font-semibold">⏰ 지각 벌금 부과</h2>
      <StudentSelect students={students} />
      <div>
        <label>날짜</label>
        <input type="date" name="occurredDate" defaultValue={today()} className="mt-1.5" />
      </div>
      <div>
        <label>메모 (선택)</label>
        <input name="reason" placeholder="예: 3교시 지각" className="mt-1.5" />
      </div>
      <div className="rounded-xl bg-surface-2 p-3">
        <p className="text-xs text-neutral-500">벌금액</p>
        <p className="mt-0.5 text-xl font-semibold">{won(lateAmount)}</p>
      </div>
      <button
        disabled={pending}
        className="w-full rounded-xl bg-white py-3 font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "부과 중…" : "벌금 부과하기"}
      </button>
    </form>
  );
}
