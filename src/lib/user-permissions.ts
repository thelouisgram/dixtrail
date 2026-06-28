import { Role } from "@prisma/client";

type UserTarget = {
  id: string;
  role: Role;
};

export function canEditUser(
  requesterRole: string,
  requesterId: string,
  target: UserTarget
): boolean {
  if (requesterRole === Role.ADMIN) return true;
  if (requesterRole === Role.MANAGER) {
    if (target.role === Role.ADMIN) return false;
    if (target.role === Role.MANAGER) return target.id === requesterId;
    return target.role === Role.SALES_REP;
  }
  return false;
}

export function canDeleteUser(
  requesterRole: string,
  requesterId: string,
  target: UserTarget
): boolean {
  if (target.id === requesterId) return false;
  if (target.role === Role.ADMIN) {
    return requesterRole === Role.ADMIN;
  }
  return requesterRole === Role.ADMIN || requesterRole === Role.MANAGER;
}
