import { getSettings } from "@/lib/settings";
import { RichText } from "@/components/RichText";

/** 점검 모드가 켜져 있을 때만 뜨는 안내 */
export async function MaintenanceBanner() {
  const s = await getSettings();
  if (!s?.maintenance_on) return null;

  const text =
    s.maintenance_text?.trim() ||
    "접속은 가능하지만 일부 기능이 원활하지 않을 수 있습니다.";

  return (
    <div
      className="sticky top-0 z-40 px-4 pb-2.5 text-center"
      // 홈 화면 앱(상태바 투명)에서 노치·상태바 밑으로 글자가 들어가지 않게 한다
      style={{
        background: "#B45309",
        color: "#fff",
        paddingTop: "calc(0.625rem + env(safe-area-inset-top))",
      }}
    >
      <p className="text-sm font-semibold">🛠 서비스 점검 중</p>
      <RichText text={text} className="mt-0.5 text-xs" />
    </div>
  );
}