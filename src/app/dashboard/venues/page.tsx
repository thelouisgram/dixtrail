import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH } from "@/lib/auth-utils";
import { canSeeVenues } from "@/lib/access";
import { getViewer } from "@/lib/auth-helpers";
import { VenuesPageClient } from "@/components/venues/venues-page-client";

export default async function VenuesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect(CLEAR_SESSION_PATH);
  if (!canSeeVenues(viewer)) redirect("/dashboard");
  return <VenuesPageClient userRole={viewer.role} />;
}
