import { Role } from "@prisma/client";

export type AccessUser = {
  id: string;
  role: Role;
  isSixClub: boolean;
  isIndependent: boolean;
};

export function isAdminOrManager(role: string) {
  return role === Role.ADMIN || role === Role.MANAGER;
}

/** 6ixClubs accounts do not see Luxe Dispense locations. */
export function canSeeLocations(user: AccessUser) {
  if (isAdminOrManager(user.role)) return true;
  return !user.isSixClub;
}

/** Luxe Dispense reps do not see 6ixClubs venues. */
export function canSeeVenues(user: AccessUser) {
  if (isAdminOrManager(user.role)) return true;
  return user.isSixClub;
}

/** Independent reps see only locations assigned to them. */
export function seesOnlyOwnLocations(user: AccessUser) {
  return !isAdminOrManager(user.role) && user.isIndependent && !user.isSixClub;
}

/** An independent 6ixClubs account sees only venues they created. */
export function seesOnlyOwnVenues(user: AccessUser) {
  return !isAdminOrManager(user.role) && user.isSixClub && user.isIndependent;
}

export function accountScopeLabel(user: {
  role: string;
  isSixClub: boolean;
  isIndependent: boolean;
}) {
  if (isAdminOrManager(user.role)) return "All data";
  if (user.isSixClub && user.isIndependent) return "Own 6ixClubs";
  if (user.isSixClub) return "6ixClubs";
  if (user.isIndependent) return "Own sales";
  return "Luxe Dispense";
}
