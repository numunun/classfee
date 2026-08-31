import { requireStudent } from "@/lib/auth";
import { StudentView } from "@/components/StudentView";

export default async function StudentPage() {
  const me = await requireStudent();
  return <StudentView me={me} />;
}