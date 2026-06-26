import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LocationsPageClient } from "@/components/locations/locations-page-client";

export default async function LocationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <LocationsPageClient userRole={session.user.role} />;
}
