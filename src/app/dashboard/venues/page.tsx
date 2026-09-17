import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { VenuesPageClient } from "@/components/venues/venues-page-client";

export default async function VenuesPage() {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);
  return <VenuesPageClient userRole={session.user.role} />;
}
