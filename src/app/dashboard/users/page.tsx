import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CLEAR_SESSION_PATH, hasCompleteSession } from "@/lib/auth-utils";
import { UsersPageClient } from "@/components/users/users-page-client";

export default async function UsersPage() {
  const session = await auth();
  if (!hasCompleteSession(session)) redirect(CLEAR_SESSION_PATH);

  const role = session.user.role as Role;
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    redirect("/dashboard");
  }

  return <UsersPageClient currentUserId={session.user.id} userRole={session.user.role} />;
}
