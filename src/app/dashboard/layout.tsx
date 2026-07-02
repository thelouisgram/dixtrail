import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);

  return (
    <DashboardShell userRole={session.user.role} userName={session.user.name}>
      {children}
    </DashboardShell>
  );
}
