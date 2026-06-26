import { LocationStatus, Role, ContactMode } from "@prisma/client";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  _count?: { assignedLocations: number; createdLocations: number };
};

export type Rep = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
};

export type Country = {
  id: string;
  name: string;
  _count?: { states: number; locations: number };
};

export type State = {
  id: string;
  name: string;
  countryId: string;
  country?: { id: string; name: string };
  _count?: { locations: number };
};

export type Location = {
  id: string;
  eventName: string;
  countryId: string;
  stateId: string;
  country: { id: string; name: string };
  state: { id: string; name: string };
  address?: string | null;
  assignedRepId?: string | null;
  assignedRep?: { id: string; name: string | null; email?: string } | null;
  createdById?: string;
  createdBy?: { id: string; name: string | null; email?: string } | null;
  status: LocationStatus;
  contactMode?: ContactMode | null;
  reachedOutDate?: string | null;
  notes?: string | null;
  normalizedEventName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LocationsPage = {
  locations: Location[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type DashboardData = {
  totalLocations: number;
  statusCounts: Record<LocationStatus, number>;
  recentLocations: Location[];
  totalUsers: number;
  totalCountries: number;
  totalStates: number;
};
