import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <NotificationsPageClient />;
}
