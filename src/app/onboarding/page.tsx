import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentStudent } from "@/lib/auth";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 이미 등록된 사용자가 주소로 직접 들어온 경우
  const me = await getCurrentStudent();
  if (me) redirect("/student");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-blue-600/90 text-2xl">
          👋
        </div>
        <h1 className="text-xl font-semibold">처음 오셨네요</h1>
        <p className="mt-2 text-sm text-neutral-400">
          이름과 학번을 입력하면 등록이 끝나요.
        </p>
        <p className="mt-1 text-xs text-neutral-500">{user.email}</p>
      </div>

      <OnboardingForm />

      <p className="mt-5 text-center text-xs text-neutral-500">
        학번은 나중에 직접 바꿀 수 없어요. 잘못 입력했다면 관리자에게 문의하세요.
      </p>
    </main>
  );
}