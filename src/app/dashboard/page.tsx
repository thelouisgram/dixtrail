import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH } from "@/lib/auth-utils";
import { getViewer } from "@/lib/auth-helpers";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (!viewer) redirect(CLEAR_SESSION_PATH);

  return (
    <DashboardPageClient
      userRole={viewer.role}
      isSixClub={viewer.isSixClub}
      isIndependent={viewer.isIndependent}
    />
  );
}
