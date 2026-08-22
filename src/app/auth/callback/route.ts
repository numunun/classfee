import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SCHOOL_DOMAIN } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=nocode`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?reason=exchange`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = (user?.email || "").toLowerCase();

  // 1) 학교 도메인 검증 (진짜 보안 장치)
  if (SCHOOL_DOMAIN && !email.endsWith("@" + SCHOOL_DOMAIN.toLowerCase())) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/error?reason=domain`);
  }

  // 2) 명단 매칭 + auth 계정 연결 (security definer RPC)
  await supabase.rpc("link_current_user");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  // 3) 명단에 없으면 거부
  if (!student) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/auth/error?reason=notlisted`);
  }

  return NextResponse.redirect(`${origin}/`);
}
