import { NotificationType } from "@prisma/client";
import type { NotificationItem } from "@/types";

export function notificationHref(notification: NotificationItem): string {
  if (notification.type === NotificationType.FOLLOW_UP_DUE) {
    return "/dashboard/locations?status=FOLLOW_UP&mineOnly=true";
  }
  return "/dashboard/locations";
}

export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case NotificationType.LOCATION_ASSIGNED:
      return "Location assigned";
    case NotificationType.CITY_ASSIGNED:
      return "City assigned";
    case NotificationType.FOLLOW_UP_DUE:
      return "Follow-up due";
    default:
      return "Notification";
  }
}
