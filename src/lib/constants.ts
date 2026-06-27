import { LocationStatus, Role, ContactMode } from "@prisma/client";

export const APP_NAME = "Dixtrail";

export const LOCATION_STATUSES = Object.values(LocationStatus);

export const STATUS_LABELS: Record<LocationStatus, string> = {
  ASSIGNED: "Assigned",
  REACHED_OUT: "Reached Out",
  FOLLOW_UP: "Follow-up",
  INTERESTED: "Interested",
  SIGNED: "Signed",
  INSTALLED: "Installed",
  DECLINED: "Declined",
};

export const STATUS_COLORS: Record<LocationStatus, string> = {
  ASSIGNED: "bg-slate-100 text-slate-700",
  REACHED_OUT: "bg-blue-100 text-blue-700",
  FOLLOW_UP: "bg-amber-100 text-amber-700",
  INTERESTED: "bg-purple-100 text-purple-700",
  SIGNED: "bg-emerald-100 text-emerald-700",
  INSTALLED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-700",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES_REP: "Sales Rep",
};

export const DEFAULT_PAGE_SIZE = 10;

export const CONTACT_MODE_LABELS: Record<ContactMode, string> = {
  EMAIL: "Email",
  PHONE: "Phone",
  IN_PERSON: "In Person",
};

export function formatContactModes(
  modes: ContactMode[] | undefined | null,
  contactEmail?: string | null,
  contactPhone?: string | null
): string {
  if (!modes?.length) return "—";
  return modes
    .map((mode) => {
      const label = CONTACT_MODE_LABELS[mode];
      if (mode === ContactMode.EMAIL && contactEmail) return `${label} (${contactEmail})`;
      if (mode === ContactMode.PHONE && contactPhone) return `${label} (${contactPhone})`;
      return label;
    })
    .join(", ");
}

export const ACTIVITY_LABELS: Record<string, string> = {
  LOCATION_CREATED: "Created location",
  LOCATION_UPDATED: "Updated location",
  LOCATION_STATUS_CHANGED: "Status changed",
  LOCATION_ASSIGNED: "Assignment changed",
  LOCATION_DELETED: "Deleted location",
};
