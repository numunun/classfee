import { getSettings } from "@/lib/settings";

/** 점검 모드가 켜져 있을 때만 모든 화면 맨 위에 뜨는 안내 */
export async function MaintenanceBanner() {
  const s = await getSettings();
  if (!s?.maintenance_on) return null;

  return (
    <div
      className="sticky top-0 z-40 px-4 py-2.5 text-center"
      style={{ background: "#B45309", color: "#fff" }}
    >
      <p className="text-sm font-semibold">🛠 서비스 점검 중</p>
      <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,.85)" }}>
        {s.maintenance_text?.trim() ||
          "접속은 가능하지만 일부 기능이 원활하지 않을 수 있습니다."}
      </p>
    </div>
  );
}