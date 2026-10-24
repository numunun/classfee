"use client";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  async function out() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={out}
      aria-label="로그아웃"
      title="로그아웃"
      className="press grid size-9 place-items-center rounded-xl text-neutral-500 hover:bg-surface-2 hover:text-neutral-300"
    >
      <LogOut className="size-[1.125rem]" aria-hidden />
    </button>
  );
}
