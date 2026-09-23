import { redirect } from "next/navigation";
import { CLEAR_SESSION_PATH } from "@/lib/auth-utils";
import { canSeeLocations } from "@/lib/access";
import { getViewer } from "@/lib/auth-helpers";
import { LocationsPageClient } from "@/components/locations/locations-page-client";

export default async function LocationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect(CLEAR_SESSION_PATH);
  if (!canSeeLocations(viewer)) redirect("/dashboard");
  return (
    <LocationsPageClient userRole={viewer.role} isIndependent={viewer.isIndependent} />
  );
}
