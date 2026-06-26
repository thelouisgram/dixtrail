import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect("/login");

  return (
    <DashboardShell userRole={session.user.role} userName={session.user.name}>
      {children}
    </DashboardShell>
  );
}
