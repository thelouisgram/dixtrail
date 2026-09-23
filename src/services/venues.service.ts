import prisma from "@/lib/prisma";
import { normalizeEventName } from "@/lib/utils";
import { CreateVenueInput, UpdateVenueInput, VenueQueryInput } from "@/lib/validations";
import {
  SixClubsRelationship,
  VendingPlacementStatus,
} from "@prisma/client";
import { parseDateInput } from "@/lib/date-utils";
import {
  canSeeVenues,
  isAdminOrManager,
  seesOnlyOwnVenues,
  type AccessUser,
} from "@/lib/access";
import { computeTheirCut } from "@/lib/money";

const venueInclude = {
  country: true,
  state: true,
  city: true,
  createdBy: { select: { id: true, name: true, email: true } },
};

function assertCanSeeVenues(viewer: AccessUser) {
  if (!canSeeVenues(viewer)) {
    throw new Error("Forbidden");
  }
}

function venueAccessScope(viewer: AccessUser) {
  assertCanSeeVenues(viewer);
  if (seesOnlyOwnVenues(viewer)) {
    return { createdById: viewer.id };
  }
  return null;
}

function combineWhere(
  filters: Record<string, unknown>,
  accessScope: Record<string, unknown> | null
) {
  const hasFilters = Object.keys(filters).length > 0;
  if (!accessScope) return filters;
  if (!hasFilters) return accessScope;
  return { AND: [accessScope, filters] };
}

async function assertStateInCountry(stateId: string, countryId: string) {
  const state = await prisma.state.findUnique({ where: { id: stateId } });
  if (!state) throw new Error("Province/State not found");
  if (state.countryId !== countryId) {
    throw new Error("Selected province/state does not belong to the selected country");
  }
}

async function assertCityInState(cityId: string | null | undefined, stateId: string) {
  if (!cityId) return;
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw new Error("City not found");
  if (city.stateId !== stateId) {
    throw new Error("Selected city does not belong to the selected province/state");
  }
}

function buildVenueWhere(query: VenueQueryInput) {
  const where: Record<string, unknown> = {};

  if (query.search) {
    const normalized = normalizeEventName(query.search);
    where.normalizedName = { contains: normalized };
  }

  if (query.venueType) where.venueType = query.venueType;
  if (query.sixClubsRelationship) where.sixClubsRelationship = query.sixClubsRelationship;
  if (query.vendingPlacementStatus) where.vendingPlacementStatus = query.vendingPlacementStatus;
  if (query.countryId) where.countryId = query.countryId;
  if (query.stateId) where.stateId = query.stateId;
  if (query.cityId) where.cityId = query.cityId;

  return where;
}

export async function getVenues(query: VenueQueryInput, viewer: AccessUser) {
  const filters = buildVenueWhere(query);
  const accessScope = venueAccessScope(viewer);
  const where = combineWhere(filters, accessScope);
  const skip = (query.page - 1) * query.limit;

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      include: venueInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.venue.count({ where }),
  ]);

  return {
    venues,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function searchVenuesByName(query: string, viewer: AccessUser) {
  const normalized = normalizeEventName(query);
  if (!normalized) return [];

  const accessScope = venueAccessScope(viewer);
  const where = combineWhere({ normalizedName: { contains: normalized } }, accessScope);

  return prisma.venue.findMany({
    where,
    include: venueInclude,
    take: 10,
  });
}

export async function createVenue(data: CreateVenueInput, viewer: AccessUser) {
  assertCanSeeVenues(viewer);
  await assertStateInCountry(data.stateId, data.countryId);
  await assertCityInState(data.cityId, data.stateId);

  const normalizedName = normalizeEventName(data.name);

  const duplicate = await prisma.venue.findFirst({
    where: { normalizedName },
  });
  if (duplicate) {
    throw new Error("A venue with this name already exists");
  }

  const cutPercentage = data.cutPercentage ?? 0;
  const grossRevenue = data.grossRevenue ?? 0;

  return prisma.venue.create({
    data: {
      name: data.name,
      normalizedName,
      countryId: data.countryId,
      stateId: data.stateId,
      cityId: data.cityId,
      address: data.address ?? null,
      venueType: data.venueType,
      decisionMakerName: data.decisionMakerName?.trim() || null,
      decisionMakerEmail: data.decisionMakerEmail?.trim() || null,
      decisionMakerPhone: data.decisionMakerPhone?.trim() || null,
      sixClubsRelationship: data.sixClubsRelationship ?? SixClubsRelationship.NONE,
      eventsPerMonth: data.eventsPerMonth ?? null,
      approximateAttendance: data.approximateAttendance ?? null,
      vendingPlacementStatus:
        data.vendingPlacementStatus ?? VendingPlacementStatus.NOT_CONTACTED,
      nextAction: data.nextAction ?? null,
      nextActionDate: data.nextActionDate ? parseDateInput(data.nextActionDate) : null,
      cutPercentage,
      grossRevenue,
      theirCut: computeTheirCut(grossRevenue, cutPercentage),
      createdById: viewer.id,
      notes: data.notes ?? null,
    },
    include: venueInclude,
  });
}

export async function updateVenue(
  id: string,
  data: UpdateVenueInput,
  viewer: AccessUser
) {
  assertCanSeeVenues(viewer);
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) throw new Error("Venue not found");
  if (seesOnlyOwnVenues(viewer) && venue.createdById !== viewer.id) {
    throw new Error("Forbidden");
  }

  const countryId = data.countryId ?? venue.countryId;
  const stateId = data.stateId ?? venue.stateId;
  const cityId = data.cityId !== undefined ? data.cityId : venue.cityId;

  if (data.countryId || data.stateId) {
    await assertStateInCountry(stateId, countryId);
  }
  await assertCityInState(cityId, stateId);

  if (data.name) {
    const normalizedName = normalizeEventName(data.name);
    const duplicate = await prisma.venue.findFirst({
      where: { normalizedName, NOT: { id } },
    });
    if (duplicate) throw new Error("A venue with this name already exists");
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.normalizedName = normalizeEventName(data.name);
  }
  if (data.countryId !== undefined) updateData.countryId = data.countryId;
  if (data.stateId !== undefined) updateData.stateId = data.stateId;
  if (data.cityId !== undefined) updateData.cityId = data.cityId;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.venueType !== undefined) updateData.venueType = data.venueType;
  if (data.decisionMakerName !== undefined) updateData.decisionMakerName = data.decisionMakerName;
  if (data.decisionMakerEmail !== undefined) {
    updateData.decisionMakerEmail = data.decisionMakerEmail?.trim() || null;
  }
  if (data.decisionMakerPhone !== undefined) {
    updateData.decisionMakerPhone = data.decisionMakerPhone?.trim() || null;
  }
  if (data.sixClubsRelationship !== undefined) {
    updateData.sixClubsRelationship = data.sixClubsRelationship;
  }
  if (data.eventsPerMonth !== undefined) updateData.eventsPerMonth = data.eventsPerMonth;
  if (data.approximateAttendance !== undefined) {
    updateData.approximateAttendance = data.approximateAttendance;
  }
  if (data.vendingPlacementStatus !== undefined) {
    updateData.vendingPlacementStatus = data.vendingPlacementStatus;
  }
  if (data.nextAction !== undefined) updateData.nextAction = data.nextAction;
  if (data.nextActionDate !== undefined) {
    updateData.nextActionDate = data.nextActionDate
      ? parseDateInput(data.nextActionDate)
      : null;
  }
  if (data.notes !== undefined) updateData.notes = data.notes;

  if (data.cutPercentage !== undefined || data.grossRevenue !== undefined) {
    const cutPercentage = data.cutPercentage ?? venue.cutPercentage ?? 0;
    const grossRevenue = data.grossRevenue ?? venue.grossRevenue ?? 0;
    updateData.cutPercentage = cutPercentage;
    updateData.grossRevenue = grossRevenue;
    updateData.theirCut = computeTheirCut(grossRevenue, cutPercentage);
  }

  return prisma.venue.update({
    where: { id },
    data: updateData,
    include: venueInclude,
  });
}

export async function deleteVenue(id: string, viewer: AccessUser) {
  if (!isAdminOrManager(viewer.role)) {
    throw new Error("Only admins and managers can delete venues");
  }

  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) throw new Error("Venue not found");

  return prisma.venue.delete({ where: { id } });
}
