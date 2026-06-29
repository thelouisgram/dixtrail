import { NotificationType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isValidObjectId } from "@/lib/utils";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  message: string;
  locationId?: string | null;
  cityId?: string | null;
}) {
  if (!isValidObjectId(input.userId)) return null;

  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        locationId: input.locationId ?? null,
        cityId: input.cityId ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function notifyLocationAssignment(
  userId: string,
  locationId: string,
  eventName: string
) {
  return createNotification({
    userId,
    type: NotificationType.LOCATION_ASSIGNED,
    message: `You were assigned to location "${eventName}"`,
    locationId,
  });
}

export async function notifyCityAssignment(
  userId: string,
  cityId: string,
  cityName: string,
  stateName: string,
  countryName: string
) {
  return createNotification({
    userId,
    type: NotificationType.CITY_ASSIGNED,
    message: `You were assigned to city ${cityName}, ${stateName}, ${countryName}`,
    cityId,
  });
}

export async function getNotificationsForUser(userId: string, limit = 20) {
  if (!isValidObjectId(userId)) {
    return { notifications: [], unreadCount: 0 };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!notification) throw new Error("Notification not found");

  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
