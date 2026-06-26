import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { TerritoriesPageClient } from "@/components/territories/territories-page-client";

export default async function TerritoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    redirect("/dashboard");
  }

  return <TerritoriesPageClient />;
}
