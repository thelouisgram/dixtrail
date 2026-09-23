import prisma from "@/lib/prisma";
import { LocationStatus } from "@prisma/client";
import type { DashboardData, DashboardVenue, Location } from "@/types";
import {
  canSeeLocations,
  canSeeVenues,
  isAdminOrManager,
  seesOnlyOwnLocations,
  seesOnlyOwnVenues,
  type AccessUser,
} from "@/lib/access";
import { computeTheirCut } from "@/lib/money";

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

function emptyStatusCounts() {
  return Object.values(LocationStatus).reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<LocationStatus, number>
  );
}

export async function getDashboardStats(viewer: AccessUser): Promise<DashboardData> {
  const showLocations = canSeeLocations(viewer);
  const showVenues = canSeeVenues(viewer);
  const view: DashboardData["view"] = showLocations && showVenues
    ? "both"
    : showVenues
      ? "venues"
      : "locations";
  const ownOnly = seesOnlyOwnLocations(viewer) || seesOnlyOwnVenues(viewer);
  const locationWhere = seesOnlyOwnLocations(viewer) ? { assignedRepId: viewer.id } : {};

  const [total, byStatus, recent] = showLocations
    ? await Promise.all([
        prisma.location.count({ where: locationWhere }),
        prisma.location.groupBy({
          by: ["status"],
          where: locationWhere,
          _count: { status: true },
        }),
        prisma.location.findMany({
          where: locationWhere,
          include: {
            country: true,
            state: true,
            city: true,
            assignedRep: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
      ])
    : [0, [] as { status: LocationStatus; _count: { status: number } }[], []];

  const statusCounts = emptyStatusCounts();
  if (Array.isArray(byStatus)) {
    byStatus.forEach((item) => {
      statusCounts[item.status] = item._count.status;
    });
  }

  const [totalUsers, totalCountries, totalStates] = isAdminOrManager(viewer.role)
    ? await Promise.all([
        prisma.user.count(),
        prisma.country.count(),
        prisma.state.count(),
      ])
    : [0, 0, 0];

  const venueWhere = seesOnlyOwnVenues(viewer) ? { createdById: viewer.id } : {};
  const venueRows = showVenues
    ? await prisma.venue.findMany({
        where: venueWhere,
        select: {
          id: true,
          name: true,
          cutPercentage: true,
          grossRevenue: true,
          theirCut: true,
          city: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const recentVenues: DashboardVenue[] = venueRows.slice(0, 5).map((venue) => ({
    id: venue.id,
    name: venue.name,
    cityName: venue.city?.name ?? null,
    cutPercentage: venue.cutPercentage ?? 0,
    grossRevenue: venue.grossRevenue ?? 0,
    theirCut: computeTheirCut(venue.grossRevenue ?? 0, venue.cutPercentage ?? 0),
  }));

  const totalGrossRevenue = venueRows.reduce((sum, venue) => sum + (venue.grossRevenue ?? 0), 0);
  const totalTheirCut = venueRows.reduce(
    (sum, venue) => sum + computeTheirCut(venue.grossRevenue ?? 0, venue.cutPercentage ?? 0),
    0
  );

  return {
    view,
    ownOnly,
    totalLocations: typeof total === "number" ? total : 0,
    statusCounts,
    recentLocations: (Array.isArray(recent) ? recent : []).map((loc) =>
      serializeLocation(loc)
    ) as Location[],
    totalUsers,
    totalCountries,
    totalStates,
    totalVenues: venueRows.length,
    totalGrossRevenue,
    totalTheirCut,
    recentVenues,
  };
}
