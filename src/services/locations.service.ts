import prisma from "@/lib/prisma";
import { normalizeEventName } from "@/lib/utils";
import {
  CreateLocationInput,
  LocationQueryInput,
  UpdateLocationInput,
} from "@/lib/validations";
import { ActivityType, LocationStatus, Role } from "@prisma/client";
import { logActivity } from "@/services/activities.service";
import { processFollowUpReminders } from "@/services/follow-up-reminders.service";
import { notifyLocationAssignment } from "@/services/notifications.service";
import { STATUS_LABELS } from "@/lib/constants";
import { parseDateInput } from "@/lib/date-utils";

const locationInclude = {
  country: true,
  state: true,
  city: true,
  assignedRep: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
};

export async function getSalesRepLocationFilter(userId: string) {
  const cityIds = (
    await prisma.userCity.findMany({
      where: { userId },
      select: { cityId: true },
    })
  ).map((row) => row.cityId);

  const or: Record<string, unknown>[] = [{ assignedRepId: userId }];
  if (cityIds.length > 0) {
    or.push({ cityId: { in: cityIds } });
  }

  return { OR: or };
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

function buildLocationWhere(query: LocationQueryInput) {
  const where: Record<string, unknown> = {};

  if (query.search) {
    const normalized = normalizeEventName(query.search);
    where.normalizedEventName = { contains: normalized };
  }

  if (query.status) where.status = query.status;
  if (query.countryId) where.countryId = query.countryId;
  if (query.stateId) where.stateId = query.stateId;
  if (query.cityId) where.cityId = query.cityId;
  if (query.assignedRepId) where.assignedRepId = query.assignedRepId;

  return where;
}

export async function getLocations(
  query: LocationQueryInput,
  userId: string,
  role: Role
) {
  await processFollowUpReminders();

  const filters = buildLocationWhere(query);
  const accessScope =
    role === Role.SALES_REP && query.mineOnly
      ? await getSalesRepLocationFilter(userId)
      : null;
  const where = combineWhere(filters, accessScope);
  const skip = (query.page - 1) * query.limit;

  const [locations, total] = await Promise.all([
    prisma.location.findMany({
      where,
      include: locationInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.location.count({ where }),
  ]);

  return {
    locations,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function searchLocationsByName(query: string) {
  const normalized = normalizeEventName(query);
  if (!normalized) return [];

  return prisma.location.findMany({
    where: { normalizedEventName: { contains: normalized } },
    include: locationInclude,
    take: 10,
  });
}

export async function createLocation(
  data: CreateLocationInput,
  userId: string,
  role: Role
) {
  await assertStateInCountry(data.stateId, data.countryId);
  await assertCityInState(data.cityId, data.stateId);

  const normalizedEventName = normalizeEventName(data.eventName);

  const duplicate = await prisma.location.findFirst({
    where: { normalizedEventName },
  });
  if (duplicate) {
    throw new Error("An event with this name already exists");
  }

  const assignedRepId =
    role === Role.SALES_REP ? userId : data.assignedRepId ?? null;

  const status = data.status ?? LocationStatus.ASSIGNED;
  const followUpDate =
    status === LocationStatus.FOLLOW_UP && data.followUpDate
      ? parseDateInput(data.followUpDate)
      : null;
  if (status === LocationStatus.FOLLOW_UP && !followUpDate) {
    throw new Error("Follow-up date is required when status is Follow-up");
  }

  const location = await prisma.location.create({
    data: {
      eventName: data.eventName,
      normalizedEventName,
      countryId: data.countryId,
      stateId: data.stateId,
      cityId: data.cityId,
      address: data.address ?? null,
      assignedRepId,
      createdById: userId,
      status,
      contactModes: data.contactModes ?? [],
      contactEmail: data.contactEmail?.trim() || null,
      contactPhone: data.contactPhone?.trim() || null,
      reachedOutDate: data.reachedOutDate ? parseDateInput(data.reachedOutDate) : null,
      followUpDate,
      notes: data.notes ?? null,
    },
    include: locationInclude,
  });

  await logActivity({
    userId,
    type: ActivityType.LOCATION_CREATED,
    locationId: location.id,
    description: `Created location "${location.eventName}"`,
  });

  if (assignedRepId && assignedRepId !== userId) {
    await logActivity({
      userId: assignedRepId,
      type: ActivityType.LOCATION_ASSIGNED,
      locationId: location.id,
      description: `Assigned to location "${location.eventName}"`,
    });
    await notifyLocationAssignment(
      assignedRepId,
      location.id,
      location.eventName
    );
  }

  await processFollowUpReminders();

  return location;
}

export async function updateLocation(
  id: string,
  data: UpdateLocationInput,
  userId: string,
  role: Role
) {
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new Error("Location not found");

  const countryId = data.countryId ?? location.countryId;
  const stateId = data.stateId ?? location.stateId;
  const cityId = data.cityId !== undefined ? data.cityId : location.cityId;

  if (data.countryId || data.stateId) {
    await assertStateInCountry(stateId, countryId);
  }
  await assertCityInState(cityId, stateId);

  if (data.eventName) {
    const normalizedEventName = normalizeEventName(data.eventName);
    const duplicate = await prisma.location.findFirst({
      where: { normalizedEventName, NOT: { id } },
    });
    if (duplicate) throw new Error("An event with this name already exists");
  }

  const updateData: {
    eventName?: string;
    normalizedEventName?: string;
    countryId?: string;
    stateId?: string;
    cityId?: string | null;
    address?: string | null;
    assignedRepId?: string | null;
    status?: LocationStatus;
    contactModes?: CreateLocationInput["contactModes"];
    contactEmail?: string | null;
    contactPhone?: string | null;
    reachedOutDate?: Date | null;
    followUpDate?: Date | null;
    notes?: string | null;
  } = {};

  const nextStatus = data.status ?? location.status;
  let nextFollowUpDate =
    data.followUpDate !== undefined
      ? data.followUpDate
        ? parseDateInput(data.followUpDate)
        : null
      : location.followUpDate;

  if (nextStatus !== LocationStatus.FOLLOW_UP) {
    nextFollowUpDate = null;
  }

  if (nextStatus === LocationStatus.FOLLOW_UP && !nextFollowUpDate) {
    throw new Error("Follow-up date is required when status is Follow-up");
  }

  if (data.eventName !== undefined) {
    updateData.eventName = data.eventName;
    updateData.normalizedEventName = normalizeEventName(data.eventName);
  }
  if (data.countryId !== undefined) updateData.countryId = data.countryId;
  if (data.stateId !== undefined) updateData.stateId = data.stateId;
  if (data.cityId !== undefined) updateData.cityId = data.cityId;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.contactModes !== undefined) updateData.contactModes = data.contactModes;
  if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail?.trim() || null;
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.reachedOutDate !== undefined) {
    updateData.reachedOutDate = data.reachedOutDate
      ? parseDateInput(data.reachedOutDate)
      : null;
  }
  if (data.status !== undefined || data.followUpDate !== undefined) {
    updateData.followUpDate = nextFollowUpDate;
  }

  if (role !== Role.SALES_REP && data.assignedRepId !== undefined) {
    updateData.assignedRepId = data.assignedRepId;
  }

  const updated = await prisma.location.update({
    where: { id },
    data: updateData,
    include: locationInclude,
  });

  const eventName = updated.eventName;

  if (data.status !== undefined && data.status !== location.status) {
    await logActivity({
      userId,
      type: ActivityType.LOCATION_STATUS_CHANGED,
      locationId: id,
      description: `Changed "${eventName}" status to ${STATUS_LABELS[data.status]}`,
    });
  } else if (
    data.assignedRepId !== undefined &&
    data.assignedRepId !== location.assignedRepId
  ) {
    await logActivity({
      userId,
      type: ActivityType.LOCATION_ASSIGNED,
      locationId: id,
      description: `Updated assignment for "${eventName}"`,
    });
    if (data.assignedRepId) {
      await logActivity({
        userId: data.assignedRepId,
        type: ActivityType.LOCATION_ASSIGNED,
        locationId: id,
        description: `Assigned to location "${eventName}"`,
      });
      if (data.assignedRepId !== userId) {
        await notifyLocationAssignment(data.assignedRepId, id, eventName);
      }
    }
  } else {
    await logActivity({
      userId,
      type: ActivityType.LOCATION_UPDATED,
      locationId: id,
      description: `Updated location "${eventName}"`,
    });
  }

  await processFollowUpReminders();

  return updated;
}

export async function deleteLocation(id: string, userId: string, role: Role) {
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    throw new Error("Only admins and managers can delete locations");
  }

  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new Error("Location not found");

  await logActivity({
    userId,
    type: ActivityType.LOCATION_DELETED,
    locationId: id,
    description: `Deleted location "${location.eventName}"`,
  });

  return prisma.location.delete({ where: { id } });
}
