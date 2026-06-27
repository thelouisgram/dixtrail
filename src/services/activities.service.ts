import { ActivityType } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function logActivity(input: {
  userId: string;
  type: ActivityType;
  locationId?: string | null;
  description: string;
}) {
  return prisma.activity.create({
    data: {
      userId: input.userId,
      type: input.type,
      locationId: input.locationId ?? null,
      description: input.description,
    },
  });
}

export async function getActivitiesForUser(userId: string, limit = 25) {
  return prisma.activity.findMany({
    where: { userId },
    include: {
      location: {
        select: {
          id: true,
          eventName: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
