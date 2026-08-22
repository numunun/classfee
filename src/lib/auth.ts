import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

// 현재 로그인한 auth 사용자 (students 명단 등록 여부와 무관)
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// 현재 로그인한 사용자의 students 레코드를 DB 에서 직접 조회.
// 클라이언트가 보낸 값이 아니라 항상 서버가 DB 로 확인한다.
export async function getCurrentStudent(): Promise<Student | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("students")
    .select("id, student_number, name, google_email, role, auth_user_id, is_independent")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (data as Student) ?? null;
}

// 로그인 O / 명단 등록 X 인 사용자는 /onboarding 으로 보낸다.
export async function requireStudent(): Promise<Student> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const me = await getCurrentStudent();
  if (!me) redirect("/onboarding");
  return me;
}