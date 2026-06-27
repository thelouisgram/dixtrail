import { LocationStatus, Role, ContactMode, ActivityType, NotificationType } from "@prisma/client";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  _count?: { assignedLocations: number; createdLocations: number; assignedCities?: number };
};

export type UsersPage = {
  users: UserRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type Rep = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  assignedCities?: {
    city: { id: string; name: string; stateId: string };
  }[];
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
  _count?: { locations: number; cities?: number };
};

export type City = {
  id: string;
  name: string;
  stateId: string;
  state?: {
    id: string;
    name: string;
    country?: { id: string; name: string };
  };
  _count?: { locations: number; userAssignments?: number };
};

export type Location = {
  id: string;
  eventName: string;
  countryId: string;
  stateId: string;
  cityId?: string | null;
  country: { id: string; name: string };
  state: { id: string; name: string };
  city?: { id: string; name: string } | null;
  address?: string | null;
  assignedRepId?: string | null;
  assignedRep?: { id: string; name: string | null; email?: string } | null;
  createdById?: string;
  createdBy?: { id: string; name: string | null; email?: string } | null;
  status: LocationStatus;
  contactModes?: ContactMode[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  reachedOutDate?: string | null;
  notes?: string | null;
  normalizedEventName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: string;
  location?: {
    id: string;
    eventName: string;
    status: LocationStatus;
  } | null;
};

export type UserDetail = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  assignedCities: {
    city: {
      id: string;
      name: string;
      state: { id: string; name: string; country: { id: string; name: string } };
    };
  }[];
  assignedLocations: Location[];
  createdLocations: Location[];
  activities: Activity[];
  _count: {
    assignedLocations: number;
    createdLocations: number;
    assignedCities: number;
    activities: number;
  };
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

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  locationId?: string | null;
  cityId?: string | null;
  createdAt: string;
};

export type NotificationsData = {
  notifications: NotificationItem[];
  unreadCount: number;
};
