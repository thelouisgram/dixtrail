import { LocationStatus, NotificationType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { endOfLocalDay, isFollowUpDueToday, startOfLocalDay } from "@/lib/date-utils";
import { createNotification } from "@/services/notifications.service";

const REMINDER_COOLDOWN_MS = 5 * 60 * 1000;
let lastRunAt = 0;

export async function processFollowUpReminders(referenceDate = new Date()) {
  const now = Date.now();
  if (now - lastRunAt < REMINDER_COOLDOWN_MS) {
    return;
  }
  lastRunAt = now;

  const locations = await prisma.location.findMany({
    where: {
      status: LocationStatus.FOLLOW_UP,
      followUpDate: { not: null },
    },
    select: {
      id: true,
      eventName: true,
      followUpDate: true,
      assignedRepId: true,
      createdById: true,
    },
  });

  const dayStart = startOfLocalDay(referenceDate);
  const dayEnd = endOfLocalDay(referenceDate);

  for (const location of locations) {
    if (!location.followUpDate || !isFollowUpDueToday(location.followUpDate, referenceDate)) {
      continue;
    }

    const recipientId = location.assignedRepId ?? location.createdById;
    if (!recipientId) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        locationId: location.id,
        type: NotificationType.FOLLOW_UP_DUE,
        userId: recipientId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    });
    if (existing) continue;

    await createNotification({
      userId: recipientId,
      type: NotificationType.FOLLOW_UP_DUE,
      message: `Follow-up due today for "${location.eventName}"`,
      locationId: location.id,
    });
  }
}
