import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";
import { PageHeader } from "@/components/PageHeader";

export default async function SettingsPage() {
  const data = await getSettings();
  if (!data) {
    return (
      <>
        <PageHeader back={{ href: "/admin", label: "대시보드" }} title="설정" />
        <p className=" text-sm text-neutral-400">설정을 불러올 수 없어요. 새로고침 해주세요.</p>
      </>
    );
  }
  return (
    <>
      <PageHeader back={{ href: "/admin", label: "대시보드" }} title="설정" />
      <SettingsForm s={data} />
    </>
  );
}
