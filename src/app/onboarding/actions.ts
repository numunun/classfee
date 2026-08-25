"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 본인 등록. role 은 DB 함수가 'student' 로 고정하므로 클라이언트가 지정할 수 없다.
export async function selfRegister(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const numberRaw = String(formData.get("studentNumber") || "").trim();
  const studentNumber = Number(numberRaw);

  if (!name) throw new Error("이름을 입력하세요.");
  if (!numberRaw || Number.isNaN(studentNumber)) throw new Error("학번을 숫자로 입력하세요.");

  const supabase = createClient();
  const { error } = await supabase.rpc("self_register", {
    p_name: name,
    p_student_number: studentNumber,
  });
  if (error) throw new Error(error.message);

  // 등록 전 상태로 캐시된 페이지들을 모두 무효화한다.
  revalidatePath("/", "layout");
}