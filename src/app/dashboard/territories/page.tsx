import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { TerritoriesPageClient } from "@/components/territories/territories-page-client";

export default async function TerritoriesPage() {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);

  const role = session.user.role as Role;
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    redirect("/dashboard");
  }

  return <TerritoriesPageClient />;
}
