import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";

export default async function Home() {
  // 관리자도 기본 화면은 학생 화면. 관리 페이지는 상단 「관리」 버튼으로 이동한다.
  await requireStudent();
  redirect("/student");
}