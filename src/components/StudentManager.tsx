"use client";

import { useState, useTransition, useRef } from "react";
import { addStudent, setRole } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";
import type { Student } from "@/lib/types";

export function StudentManager({ students }: { students: Student[] }) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  return (
    <div className="space-y-5">
      <form
        ref={formRef}
        action={async (fd) => {
          try {
            await addStudent(fd);
            formRef.current?.reset();
            toast("학생을 추가했어요");
          } catch (e) {
            toast((e as Error).message, "error");
          }
        }}
        className="space-y-3 rounded-2xl bg-surface p-5"
      >
        <h2 className="font-medium">학생 추가</h2>
        <div className="grid grid-cols-2 gap-3">
          <input name="number" type="number" placeholder="학번" />
          <input name="name" placeholder="이름" required />
        </div>
        <input name="email" type="email" placeholder="학교 구글 이메일" required />
        <div className="flex items-center gap-3">
          <select name="role" defaultValue="student" className="flex-1">
            <option value="student">일반 학생</option>
            <option value="admin">관리자 (반장/부반장/법무부장)</option>
          </select>
          <button className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-neutral-900">
            추가
          </button>
        </div>
      </form>

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {students.map((s) => (
          <li key={s.id} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0">
            <div>
              <p className="text-sm">
                {s.student_number ? <span className="mr-2 text-neutral-500">{s.student_number}</span> : null}
                {s.name}
              </p>
              <p className="text-xs text-neutral-500">{s.google_email}</p>
            </div>
            <button
              disabled={pending}
              onClick={() => start(() => setRole(s.id, s.role === "admin" ? "student" : "admin"))}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                s.role === "admin" ? "bg-blue-900/60 text-blue-300" : "bg-surface-2 text-neutral-400"
              }`}
            >
              {s.role === "admin" ? "관리자" : "학생"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
