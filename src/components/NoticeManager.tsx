"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { RichText } from "@/components/RichText";
import {
  createNotice,
  updateNotice,
  setNoticeActive,
  deleteNotice,
} from "@/app/admin/notices/actions";
import { useToast } from "@/components/Toast";
import { AutoTextarea } from "@/components/AutoTextarea";

export type NoticeRow = {
  id: string;
  title: string;
  body: string | null;
  is_active: boolean;
  created_at: string;
};

function ko(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function NoticeManager({ rows }: { rows: NoticeRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const active = rows.filter((r) => r.is_active);
  const hidden = rows.filter((r) => !r.is_active);

  function act(fn: () => Promise<void>, msg?: string) {
    start(async () => {
      try {
        await fn();
        if (msg) toast(msg);
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });
  }

  return (
    <div className="space-y-5">
      <form
        ref={formRef}
        action={async (fd) => {
          try {
            await createNotice(fd);
            formRef.current?.reset();
            toast("공지를 올렸어요.");
            router.refresh();
          } catch (e) {
            toast((e as Error).message, "error");
          }
        }}
        className="space-y-3 rounded-2xl bg-surface p-5"
      >
        <h2 className="font-medium">새 공지</h2>
        <div>
          <label htmlFor="title">제목</label>
          <input
            id="title"
            name="title"
            required
            maxLength={60}
            placeholder="예: 벌금 계좌가 바뀌었어요"
            className="mt-1.5"
          />
        </div>
        <div>
          <label htmlFor="body">
            내용 (선택) · <span className="font-mono">**굵게**</span>{" "}
            <span className="font-mono">~~취소선~~</span>
          </label>
          <AutoTextarea id="body" name="body" minRows={4} className="mt-1.5" />
        </div>
        <button
          disabled={pending}
          className="h-12 w-full rounded-xl bg-white font-medium text-neutral-900 disabled:opacity-50"
        >
          올리기
        </button>
      </form>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">
          게시 중 ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-neutral-500">
            게시 중인 공지가 없어요. 학생 화면에 공지칸이 보이지 않아요.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((n) => (
              <NoticeItem key={n.id} n={n} pending={pending} act={act} />
            ))}
          </ul>
        )}
      </section>

      {hidden.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-300">
            내려둔 공지 ({hidden.length})
          </h2>
          <ul className="space-y-2">
            {hidden.map((n) => (
              <NoticeItem key={n.id} n={n} pending={pending} act={act} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function NoticeItem({
  n,
  pending,
  act,
}: {
  n: NoticeRow;
  pending: boolean;
  act: (fn: () => Promise<void>, msg?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(n.title);
  const [body, setBody] = useState(n.body ?? "");

  return (
    <li
      className={`rounded-2xl bg-surface p-4 ${n.is_active ? "" : "opacity-60"}`}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
          />
          <AutoTextarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minRows={4}
          />
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() =>
                act(async () => {
                  await updateNotice(n.id, title, body);
                  setEditing(false);
                }, "공지를 수정했어요.")
              }
              className="h-10 flex-1 rounded-xl bg-white text-sm font-medium text-neutral-900 disabled:opacity-50"
            >
              저장
            </button>
            <button
              onClick={() => {
                setTitle(n.title);
                setBody(n.body ?? "");
                setEditing(false);
              }}
              className="h-10 rounded-xl bg-surface-2 px-4 text-sm text-neutral-400"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-neutral-100">{n.title}</p>
            <span className="shrink-0 text-xs text-neutral-600">
              {ko(n.created_at)}
            </span>
          </div>
          {n.body && (
            <RichText text={n.body} className="mt-1 text-sm leading-relaxed text-neutral-400" />
          )}
          <div className="mt-3 flex gap-2">
            <button
              disabled={pending}
              onClick={() => setEditing(true)}
              className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-neutral-300 disabled:opacity-50"
            >
              수정
            </button>
            <button
              disabled={pending}
              onClick={() =>
                act(
                  () => setNoticeActive(n.id, !n.is_active),
                  n.is_active ? "공지를 내렸어요." : "공지를 다시 올렸어요.",
                )
              }
              className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-neutral-300 disabled:opacity-50"
            >
              {n.is_active ? "내리기" : "다시 올리기"}
            </button>
            <button
              disabled={pending}
              onClick={() =>
                act(() => deleteNotice(n.id), "공지를 삭제했어요.")
              }
              className="ml-auto rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-neutral-500 hover:text-red-300 disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </li>
  );
}