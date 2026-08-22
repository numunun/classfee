import Link from "next/link";

const MESSAGES: Record<string, string> = {
  domain: "학교 구글 계정(@학교도메인)으로만 로그인할 수 있어요.",
  notlisted: "명단에 등록되지 않은 계정이에요. 반장에게 등록을 요청하세요.",
  exchange: "로그인 처리 중 문제가 생겼어요. 다시 시도해 주세요.",
  nocode: "로그인 정보가 없어요. 다시 시도해 주세요.",
};

export default function AuthError({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const msg = MESSAGES[searchParams.reason ?? ""] ?? "로그인할 수 없어요.";
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-lg font-semibold">로그인 실패</h1>
        <p className="mt-3 text-sm text-neutral-400">{msg}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-neutral-900"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
