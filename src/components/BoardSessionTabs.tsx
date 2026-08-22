"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SESSIONS,
  SESSION_LABEL,
  SESSION_TIME,
  liveSessionAt,
  type Session,
} from "@/lib/night-study";

const BASE = "rounded-xl border px-[0.9em] py-[0.35em] font-bold transition";
const SELECTED = "border-white bg-white text-neutral-900";
const LIVE = "border-green-700 bg-surface-2 text-green-300";
const IDLE = "border-line bg-surface-2 text-neutral-400 opacity-35";
const NEUTRAL = "border-line bg-surface-2 text-neutral-400";

export function BoardSessionTabs({
  current,
  query,
  className = "",
}: {
  current: Session;
  query: string;
  className?: string;
}) {
  const router = useRouter();
  const [live, setLive] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const prevLive = useRef<Session | null>(null);

  useEffect(() => {
    const compute = () => {
      const d = new Date();
      setLive(liveSessionAt(d.getHours() * 60 + d.getMinutes()));
      setReady(true);
    };
    compute();
    const id = setInterval(compute, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (prevLive.current === live) return;
    const changed = prevLive.current;
    prevLive.current = live;
    if (changed === null && live === null) return;
    if (live !== null && live !== current) {
      router.replace("?s=" + live + query);
    }
  }, [ready, live, current, query, router]);

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      {SESSIONS.map(function (n) {
        const selected = current === n;
        const isLive = ready && live === n;

        let tone = NEUTRAL;
        if (selected) tone = SELECTED;
        else if (isLive) tone = LIVE;
        else if (ready) tone = IDLE;

        return (
          <a key={n} href={"?s=" + n + query} title={SESSION_TIME[n].label} className={BASE + " " + tone}>
            <span>{SESSION_LABEL[n]}</span>
            {isLive ? <span className="ml-1.5 inline-block size-2 rounded-full bg-green-400" /> : null}
          </a>
        );
      })}
    </div>
  );
}