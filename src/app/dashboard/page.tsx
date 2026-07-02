import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { DashboardPageClient } from "@/components/dashboard/dashboard-page-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);

  return <DashboardPageClient userRole={session.user.role} />;
}
