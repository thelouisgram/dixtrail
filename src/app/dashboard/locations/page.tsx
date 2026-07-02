import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { LocationsPageClient } from "@/components/locations/locations-page-client";

export default async function LocationsPage() {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);
  return <LocationsPageClient userRole={session.user.role} />;
}
