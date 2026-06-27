import { NotificationType } from "@prisma/client";
import type { NotificationItem } from "@/types";

export function notificationHref(_notification: NotificationItem): string {
  return "/dashboard/locations";
}

export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case NotificationType.LOCATION_ASSIGNED:
      return "Location assigned";
    case NotificationType.CITY_ASSIGNED:
      return "City assigned";
    default:
      return "Notification";
  }
}
