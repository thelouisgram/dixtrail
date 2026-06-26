import prisma from "@/lib/prisma";
import { LocationStatus, Role } from "@prisma/client";

export async function getDashboardStats(userId: string, role: Role) {
  const baseWhere =
    role === Role.SALES_REP
      ? { OR: [{ assignedRepId: userId }, { createdById: userId }] }
      : {};

  const [total, byStatus, recent] = await Promise.all([
    prisma.location.count({ where: baseWhere }),
    prisma.location.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { status: true },
    }),
    prisma.location.findMany({
      where: baseWhere,
      include: {
        country: true,
        state: true,
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
    recentLocations: recent,
    totalUsers,
    totalCountries,
    totalStates,
  };
}
