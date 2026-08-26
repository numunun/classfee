import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

// cache() 로 감싸면 한 번의 요청(레이아웃 + 페이지 + 하위 컴포넌트) 안에서
// 몇 번을 호출하든 실제 조회는 한 번만 일어난다.
// 이게 없으면 admin/layout 과 admin/page 가 각각 인증 왕복을 해서 두 배로 느려진다.

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentStudent = cache(async (): Promise<Student | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_number, name, google_email, role, auth_user_id, is_independent")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (data as Student) ?? null;
});

// 로그인 O / 명단 등록 X 인 사용자는 /onboarding 으로 보낸다.
export async function requireStudent(): Promise<Student> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const me = await getCurrentStudent();
  if (!me) redirect("/onboarding");
  return me;
}