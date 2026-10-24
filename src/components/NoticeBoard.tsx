import { createClient } from "@/lib/supabase/server";
import { Megaphone } from "lucide-react";
import { CardTitle } from "@/components/CardTitle";
import { RichText } from "@/components/RichText";

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
    <section className="rounded-3xl bg-surface p-5">
      <CardTitle icon={Megaphone}>공지</CardTitle>
      <ul className="mt-3 divide-y divide-line">
        {notices.map((n) => (
          <li key={n.id} className="py-3 first:pt-1 last:pb-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[0.9375rem] font-semibold text-neutral-100">{n.title}</p>
              <span className="shrink-0 text-xs text-neutral-600">{ko(n.created_at)}</span>
            </div>
            {n.body && (
              <RichText
                text={n.body}
                className="mt-1 text-sm leading-relaxed text-neutral-300"
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}