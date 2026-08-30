import { createClient } from "@/lib/supabase/server";

type Notice = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
};

function ko(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 게시 중인 공지가 하나도 없으면 아무것도 그리지 않는다. */
export async function NoticeBoard() {
  const supabase = createClient();
  const { data } = await supabase
    .from("notices")
    .select("id, title, body, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const notices = (data ?? []) as Notice[];
  if (notices.length === 0) return null;

  return (
    <section className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
      <h2 className="text-sm font-semibold text-accent">📢 공지</h2>
      <ul className="mt-3 space-y-3">
        {notices.map((n) => (
          <li key={n.id} className="border-l-2 border-accent/60 pl-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-neutral-100">{n.title}</p>
              <span className="shrink-0 text-xs text-neutral-600">{ko(n.created_at)}</span>
            </div>
            {n.body && (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-300">
                {n.body}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}