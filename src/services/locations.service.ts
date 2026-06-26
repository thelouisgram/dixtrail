import prisma from "@/lib/prisma";
import { normalizeEventName } from "@/lib/utils";
import {
  CreateLocationInput,
  LocationQueryInput,
  UpdateLocationInput,
} from "@/lib/validations";
import { LocationStatus, Role } from "@prisma/client";

const locationInclude = {
  country: true,
  state: true,
  assignedRep: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
};

async function assertStateInCountry(stateId: string, countryId: string) {
  const state = await prisma.state.findUnique({ where: { id: stateId } });
  if (!state) throw new Error("State not found");
  if (state.countryId !== countryId) {
    throw new Error("Selected state does not belong to the selected country");
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
  if (query.assignedRepId) where.assignedRepId = query.assignedRepId;

  return where;
}

export async function getLocations(
  query: LocationQueryInput,
  _userId: string,
  _role: Role
) {
  const where = buildLocationWhere(query);
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

  const normalizedEventName = normalizeEventName(data.eventName);

  const duplicate = await prisma.location.findFirst({
    where: { normalizedEventName },
  });
  if (duplicate) {
    throw new Error("An event with this name already exists");
  }

  const assignedRepId =
    role === Role.SALES_REP ? userId : data.assignedRepId ?? null;

  return prisma.location.create({
    data: {
      eventName: data.eventName,
      normalizedEventName,
      countryId: data.countryId,
      stateId: data.stateId,
      address: data.address ?? null,
      assignedRepId,
      createdById: userId,
      status: data.status ?? LocationStatus.ASSIGNED,
      contactMode: data.contactMode ?? null,
      reachedOutDate: data.reachedOutDate ? new Date(data.reachedOutDate) : null,
      notes: data.notes ?? null,
    },
    include: locationInclude,
  });
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

  if (data.countryId || data.stateId) {
    await assertStateInCountry(stateId, countryId);
  }

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
    address?: string | null;
    assignedRepId?: string | null;
    status?: LocationStatus;
    contactMode?: CreateLocationInput["contactMode"];
    reachedOutDate?: Date | null;
    notes?: string | null;
  } = {};

  if (data.eventName !== undefined) {
    updateData.eventName = data.eventName;
    updateData.normalizedEventName = normalizeEventName(data.eventName);
  }
  if (data.countryId !== undefined) updateData.countryId = data.countryId;
  if (data.stateId !== undefined) updateData.stateId = data.stateId;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.contactMode !== undefined) updateData.contactMode = data.contactMode;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.reachedOutDate !== undefined) {
    updateData.reachedOutDate = data.reachedOutDate
      ? new Date(data.reachedOutDate)
      : null;
  }

  if (role !== Role.SALES_REP && data.assignedRepId !== undefined) {
    updateData.assignedRepId = data.assignedRepId;
  }

  return prisma.location.update({
    where: { id },
    data: updateData,
    include: locationInclude,
  });
}

export async function deleteLocation(id: string, role: Role) {
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    throw new Error("Only admins and managers can delete locations");
  }

  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) throw new Error("Location not found");

  return prisma.location.delete({ where: { id } });
}
