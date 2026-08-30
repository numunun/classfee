"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { addStudent, setRole } from "@/app/admin/actions";
import { useToast } from "@/components/Toast";
import type { Student } from "@/lib/types";
import Link from "next/link";

export function StudentManager({ students }: { students: Student[] }) {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="space-y-5">
      <form
        ref={formRef}
        action={async (fd) => {
          const res = await addStudent(fd);
          if (res.ok) {
            formRef.current?.reset();
            toast("학생을 추가했어요.");
            router.refresh();
          } else {
            toast(res.message, "error");
          }
        }}
        className="space-y-3 rounded-2xl bg-surface p-5"
      >
        <h2 className="font-medium">학생 추가</h2>
        <p className="text-xs leading-relaxed text-neutral-500">
          미리 등록하지 않아도 학생이 구글 로그인하면 스스로 등록해요. 관리자를 지정할 때만 쓰면 돼요.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input name="number" type="number" inputMode="numeric" placeholder="학번 (예: 20935)" />
          <input name="name" placeholder="이름" required maxLength={20} />
        </div>
        <input name="email" type="email" placeholder="학교 구글 이메일" required />
        <div className="flex gap-3">
          <select name="role" defaultValue="student" className="flex-1">
            <option value="student">일반 학생</option>
            <option value="admin">관리자 (반장/부반장/법무부장)</option>
          </select>
          <button
            disabled={pending}
            className="h-[2.875rem] shrink-0 rounded-xl bg-white px-6 text-sm font-medium text-neutral-900 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </form>

      <ul className="overflow-hidden rounded-2xl bg-surface">
        {students.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0"
          >
            <Link href={`/admin/students/${s.id}`} className="min-w-0 flex-1">
              <p className="text-sm">
                {s.student_number ? (
                  <span className="mr-2 text-neutral-500">{s.student_number}</span>
                ) : null}
                {s.name}
                {!s.auth_user_id && (
                  <span className="ml-2 text-xs text-neutral-600">미로그인</span>
                )}
                <span className="ml-2 text-xs text-neutral-600">›</span>
              </p>
              <p className="truncate text-xs text-neutral-500">{s.google_email}</p>
            </Link>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await setRole(s.id, s.role === "admin" ? "student" : "admin");
                  if (res.ok) {
                    toast(s.role === "admin" ? "학생으로 바꿨어요." : "관리자로 지정했어요.");
                    router.refresh();
                  } else {
                    toast(res.message, "error");
                  }
                })
              }
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                s.role === "admin"
                  ? "bg-blue-900/60 text-blue-300"
                  : "bg-surface-2 text-neutral-400"
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