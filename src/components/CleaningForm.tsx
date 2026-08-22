"use client";

import { useState } from "react";
import { saveCleaning } from "@/app/admin/actions";

const today = () => new Date().toISOString().slice(0, 10);

export function CleaningForm({
  students,
}: {
  students: { id: string; name: string; student_number: number | null }[];
}) {
  const [absent, setAbsent] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  function toggle(id: string) {
    setAbsent((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await saveCleaning(fd);
          alert(`저장했어요. 불참 ${absent.size}명에게 청소 벌금이 자동 부과됩니다.`);
          setAbsent(new Set());
        } catch (e) {
          alert((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-surface p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>날짜</label>
            <input type="date" name="date" defaultValue={today()} className="mt-1.5" />
          </div>
          <div>
            <label>청소 구역</label>
            <input name="area" placeholder="예: 교실 뒤쪽" className="mt-1.5" />
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          불참한 학생만 체크하세요. 체크된 학생에게 청소 벌금이 자동으로 들어갑니다.
        </p>
      </div>

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {students.map((s) => {
          const isAbsent = absent.has(s.id);
          return (
            <li key={s.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
              <input type="hidden" name="studentId" value={s.id} />
              {isAbsent && <input type="hidden" name="absent" value={s.id} />}
              <span className="text-sm">
                {s.student_number ? <span className="mr-2 text-neutral-500">{s.student_number}</span> : null}
                {s.name}
              </span>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isAbsent ? "bg-red-600 text-white" : "bg-surface-2 text-neutral-400"
                }`}
              >
                {isAbsent ? "불참" : "참석"}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        disabled={pending}
        className="w-full rounded-xl bg-white py-3 font-medium text-neutral-900 disabled:opacity-50"
      >
        {pending ? "저장 중…" : `저장하기 (불참 ${absent.size}명)`}
      </button>
    </form>
  );
}
