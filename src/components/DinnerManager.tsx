"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDinners, deleteDinner } from "@/app/admin/meals/actions";
import { dinnerLabel } from "@/lib/dinner-parse";
import { useToast } from "@/components/Toast";

export type DinnerRow = { meal_date: string; menu: string };

const SAMPLE = `2026-09-01\t돈까스, 미소된장국, 양배추샐러드, 깍두기
2026-09-02\t~쉐프특식~, 제육볶음, 콩나물국, 계란찜, 배추김치`;

export function DinnerManager({ rows }: { rows: DinnerRow[] }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function submit() {
    if (!text.trim()) return toast("붙여넣은 내용이 없어요.", "error");
    start(async () => {
      try {
        const res = await saveDinners(text);
        toast(`${res.saved}일치를 저장했어요.`);
        if (res.errors.length > 0) {
          toast(`건너뛴 줄 ${res.errors.length}개: ${res.errors[0]}`, "error");
        }
        setText("");
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  function remove(date: string) {
    start(async () => {
      try {
        await deleteDinner(date);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-surface p-5">
        <h2 className="font-medium">석식 한 번에 등록</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          한 줄에 하루씩, <span className="text-neutral-300">날짜 + 메뉴</span> 순서로 붙여넣으세요.
          엑셀에서 두 열을 복사하면 그대로 맞아요. 같은 날짜가 이미 있으면 덮어써요.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          특식 이름처럼 눈에 띄게 하고 싶은 항목은{" "}
          <span className="font-mono text-amber-300">~쉐프특식~</span> 처럼 물결로 감싸세요.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={SAMPLE}
          className="mt-3 font-mono text-xs"
        />

        <button
          onClick={submit}
          disabled={pending}
          className="mt-3 h-12 w-full rounded-xl bg-white font-medium text-neutral-900 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장하기"}
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">
          등록된 석식 ({rows.length}일)
        </h2>
        <ul className="overflow-hidden rounded-2xl bg-surface">
          {rows.map((r) => (
            <li
              key={r.meal_date}
              className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">{dinnerLabel(r.meal_date)}</p>
                <p className="mt-0.5 text-sm text-neutral-200">{r.menu}</p>
              </div>
              <button
                disabled={pending}
                onClick={() => remove(r.meal_date)}
                className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 text-xs text-neutral-500 disabled:opacity-50"
              >
                삭제
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-neutral-500">
              아직 등록된 석식이 없어요.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}