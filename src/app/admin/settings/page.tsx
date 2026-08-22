import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const data = await getSettings();
  if (!data) {
    return (
      <>
        <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
        <p className="mt-6 text-sm text-neutral-400">설정을 불러올 수 없어요. 새로고침 해주세요.</p>
      </>
    );
  }
  return (
    <>
      <Link href="/admin" className="text-sm text-neutral-500">← 대시보드</Link>
      <h1 className="mb-4 mt-2 text-lg font-semibold">설정</h1>
      <SettingsForm s={data} />
    </>
  );
}
