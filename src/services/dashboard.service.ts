import prisma from "@/lib/prisma";
import { LocationStatus, Role } from "@prisma/client";
import type { DashboardData, Location } from "@/types";
import { getSalesRepLocationFilter } from "@/services/locations.service";

function serializeLocation<T extends {
  reachedOutDate?: Date | null;
  followUpDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}>(location: T) {
  return {
    ...location,
    reachedOutDate: location.reachedOutDate?.toISOString() ?? null,
    followUpDate: location.followUpDate?.toISOString() ?? null,
    createdAt: location.createdAt?.toISOString(),
    updatedAt: location.updatedAt?.toISOString(),
  };
}

export async function getDashboardStats(userId: string, role: Role): Promise<DashboardData> {
  const scope =
    role === Role.SALES_REP ? await getSalesRepLocationFilter(userId) : {};

  const [total, byStatus, recent] = await Promise.all([
    prisma.location.count({ where: scope }),
    prisma.location.groupBy({
      by: ["status"],
      where: scope,
      _count: { status: true },
    }),
    prisma.location.findMany({
      where: scope,
      include: {
        country: true,
        state: true,
        city: true,
        assignedRep: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const statusCounts = Object.values(LocationStatus).reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<LocationStatus, number>
  );

  byStatus.forEach((item) => {
    statusCounts[item.status] = item._count.status;
  });

  const [totalUsers, totalCountries, totalStates] =
    role === Role.ADMIN || role === Role.MANAGER
      ? await Promise.all([
          prisma.user.count(),
          prisma.country.count(),
          prisma.state.count(),
        ])
      : [0, 0, 0];

  return {
    totalLocations: total,
    statusCounts,
    recentLocations: recent.map((loc) => serializeLocation(loc)) as Location[],
    totalUsers,
    totalCountries,
    totalStates,
  };
}
