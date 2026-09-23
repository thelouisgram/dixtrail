import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH } from "@/lib/auth-utils";
import { getViewer } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect(CLEAR_SESSION_PATH);

  return (
    <DashboardShell
      userRole={viewer.role}
      userName={viewer.name}
      isSixClub={viewer.isSixClub}
      isIndependent={viewer.isIndependent}
    >
      {children}
    </DashboardShell>
  );
}
