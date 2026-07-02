import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);
  return <NotificationsPageClient />;
}
