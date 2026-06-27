import { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getSession() {
  return auth();
}

async function refreshSessionRole(session: Session) {
  if (!session.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!dbUser) return null;

  session.user.role = dbUser.role;
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!/^[a-f\d]{24}$/i.test(session.user.id)) {
    throw new Error("Unauthorized");
  }

  const refreshed = await refreshSessionRole(session);
  if (!refreshed) {
    throw new Error("Unauthorized");
  }

  return refreshed;
}

export async function requireRole(roles: Role[]) {
  const session = await requireAuth();
  const role = session.user.role as Role;
  if (!roles.includes(role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export function isAdminOrManager(role: string) {
  return role === Role.ADMIN || role === Role.MANAGER;
}
