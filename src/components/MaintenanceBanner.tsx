import { headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import { RichText } from "@/components/RichText";

/** 점검 모드가 켜져 있을 때만 뜨는 안내. 전자칠판(/board)에는 띄우지 않는다. */
export async function MaintenanceBanner() {
  // 전자칠판은 교실에 상시 띄워두는 공용 화면이라 배너를 제외한다.
  const path = headers().get("x-pathname") ?? "";
  if (path.startsWith("/board")) return null;

  const s = await getSettings();
  if (!s?.maintenance_on) return null;

  const text =
    s.maintenance_text?.trim() ||
    "접속은 가능하지만 일부 기능이 원활하지 않을 수 있습니다.";

  return (
    <div
      className="sticky top-0 z-40 px-4 py-2.5 text-center"
      style={{ background: "#B45309", color: "#fff" }}
    >
      <p className="text-sm font-semibold">🛠 서비스 점검 중</p>
      <RichText text={text} className="mt-0.5 text-xs" />
    </div>
  );
}