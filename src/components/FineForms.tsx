"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLateFine, createOtherFine } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";
import { won, type Student } from "@/lib/types";

// UTC 기준 toISOString() 을 쓰면 한국 자정~오전 9시 사이에 하루가 밀린다.
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

type Opt = Pick<Student, "id" | "name" | "student_number">;

export function FineForms({ students, lateAmount }: { students: Opt[]; lateAmount: number }) {
  const [tab, setTab] = useState<"late" | "other">("late");
  return (
    <>
      <div className="mb-4 flex gap-2">
        <Tab active={tab === "late"} onClick={() => setTab("late")}>⏰ 지각</Tab>
        <Tab active={tab === "other"} onClick={() => setTab("other")}>✏️ 기타</Tab>
      </div>
      {tab === "late" ? (
        <LateForm students={students} lateAmount={lateAmount} />
      ) : (
        <OtherForm students={students} />
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
      className={`h-11 rounded-xl px-4 text-sm font-medium ${
        active ? "bg-white text-neutral-900" : "bg-surface-2 text-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function StudentSelect({ students }: { students: Opt[] }) {
  return (
    <div>
      <label htmlFor="studentId">학생 선택</label>
      <select id="studentId" name="studentId" defaultValue="" required className="mt-1.5">
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

function LateForm({ students, lateAmount }: { students: Opt[]; lateAmount: number }) {
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
      <h2 className="font-semibold">⏰ 지각 벌금 부과</h2>
      <StudentSelect students={students} />
      <div>
        <label htmlFor="lateDate">날짜</label>
        <input id="lateDate" type="date" name="occurredDate" defaultValue={today()} className="mt-1.5" />
      </div>
      <div>
        <label htmlFor="lateReason">메모 (선택)</label>
        <input id="lateReason" name="reason" placeholder="예: 조회 10분 초과" className="mt-1.5" />
      </div>
      <div className="rounded-xl bg-surface-2 p-3">
        <p className="text-xs text-neutral-500">벌금액</p>
        <p className="mt-0.5 text-xl font-semibold">{won(lateAmount)}</p>
      </div>
      <button
        disabled={pending}
        className="h-12 w-full rounded-xl bg-white font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "부과 중…" : "벌금 부과하기"}
      </button>
    </form>
  );
}

function OtherForm({ students }: { students: Opt[] }) {
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
          await createOtherFine(fd);
          formRef.current?.reset();
          toast("벌금을 부과했어요.");
          router.push("/admin");
        } catch (e) {
          toast((e as Error).message, "error");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4 rounded-2xl bg-surface p-5"
    >
      <h2 className="font-semibold">✏️ 기타 벌금 부과</h2>
      <StudentSelect students={students} />
      <div>
        <label htmlFor="otherDate">날짜</label>
        <input id="otherDate" type="date" name="occurredDate" defaultValue={today()} className="mt-1.5" />
      </div>
      <div>
        <label htmlFor="otherReason">사유 (필수)</label>
        <input id="otherReason" name="reason" required placeholder="예: 급식실 새치기" className="mt-1.5" />
      </div>
      <div>
        <label htmlFor="otherAmount">금액</label>
        <input id="otherAmount" name="amount" type="number" min={100} step={100} defaultValue={1000} required className="mt-1.5" />
      </div>
      <button
        disabled={pending}
        className="h-12 w-full rounded-xl bg-white font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "부과 중…" : "벌금 부과하기"}
      </button>
    </form>
  );
}