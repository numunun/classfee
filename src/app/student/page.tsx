import { requireStudent } from "@/lib/auth";
import { StudentView } from "@/components/StudentView";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

export default async function StudentPage() {
  const me = await requireStudent();
  return (
    <>
      <MaintenanceBanner />
      <StudentView me={me} />
    </>
  );
}