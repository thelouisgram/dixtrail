import { ActivityType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { CreateUserInput, UpdateUserInput, UserQueryInput } from "@/lib/validations";
import { getActivitiesForUser } from "@/services/activities.service";
import { notifyCityAssignment } from "@/services/notifications.service";

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

function serializeUserRow<T extends { createdAt: Date }>(user: T) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
}

async function syncUserCities(userId: string, cityIds: string[]) {
  const uniqueIds = [...new Set(cityIds)];

  const existing = await prisma.userCity.findMany({
    where: { userId },
    select: { cityId: true },
  });
  const existingIds = new Set(existing.map((row) => row.cityId));

  if (uniqueIds.length > 0) {
    const cities = await prisma.city.findMany({
      where: { id: { in: uniqueIds } },
      include: { state: { include: { country: true } } },
    });
    if (cities.length !== uniqueIds.length) {
      throw new Error("One or more selected cities are invalid");
    }

    await prisma.userCity.deleteMany({ where: { userId } });

    if (uniqueIds.length > 0) {
      await prisma.userCity.createMany({
        data: uniqueIds.map((cityId) => ({ userId, cityId })),
      });
    }

    for (const city of cities) {
      if (!existingIds.has(city.id)) {
        await notifyCityAssignment(
          userId,
          city.id,
          city.name,
          city.state.name,
          city.state.country.name
        );
      }
    }
    return;
  }

  await prisma.userCity.deleteMany({ where: { userId } });
}

export async function getUsers(query: UserQueryInput) {
  const search = query.search?.trim();
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(serializeUserRow),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      assignedCities: {
        include: {
          city: {
            include: {
              state: { include: { country: true } },
            },
          },
        },
      },
      assignedLocations: {
        include: {
          country: true,
          state: true,
          city: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      },
      createdLocations: {
        include: {
          country: true,
          state: true,
          city: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: {
          assignedLocations: true,
          createdLocations: true,
          assignedCities: true,
          activities: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const activities = await getActivitiesForUser(id);

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    assignedLocations: user.assignedLocations.map((loc) => ({
      ...loc,
      reachedOutDate: loc.reachedOutDate?.toISOString() ?? null,
      followUpDate: loc.followUpDate?.toISOString() ?? null,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    })),
    createdLocations: user.createdLocations.map((loc) => ({
      ...loc,
      reachedOutDate: loc.reachedOutDate?.toISOString() ?? null,
      followUpDate: loc.followUpDate?.toISOString() ?? null,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    })),
    activities: activities.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export async function createUser(data: CreateUserInput, requesterRole: Role) {
  if (requesterRole === Role.MANAGER) {
    if (data.role === Role.ADMIN) {
      throw new Error("Managers cannot create admin accounts");
    }
    if (data.role === Role.MANAGER) {
      throw new Error("Managers cannot create other manager accounts");
    }
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role,
    },
    select: userListSelect,
  });

  if (data.cityIds?.length) {
    await syncUserCities(user.id, data.cityIds);
  }

  const created = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: userListSelect,
  });
  return serializeUserRow(created);
}

export async function updateUser(
  id: string,
  data: UpdateUserInput,
  requesterRole: Role,
  requesterId: string
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  if (requesterRole === Role.MANAGER) {
    if (user.role === Role.ADMIN) {
      throw new Error("Managers cannot update admin accounts");
    }
    if (user.role === Role.MANAGER && user.id !== requesterId) {
      throw new Error("Managers can only update their own manager profile");
    }
    if (
      data.role !== undefined &&
      data.role !== user.role &&
      (data.role === Role.ADMIN || data.role === Role.MANAGER)
    ) {
      throw new Error("Managers cannot assign admin or manager roles");
    }
  }

  if (
    data.role !== undefined &&
    user.role === Role.ADMIN &&
    data.role !== Role.ADMIN
  ) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      throw new Error("Cannot change the role of the last admin account");
    }
  }

  if (data.email !== undefined) {
    const email = data.email.toLowerCase();
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error("User with this email already exists");
    }
  }

  const updateData: {
    name?: string;
    email?: string;
    role?: Role;
    password?: string;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.role !== undefined && data.role !== user.role) updateData.role = data.role;
  if (data.password?.trim()) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  if (data.cityIds !== undefined) {
    await syncUserCities(id, data.cityIds);
  }

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: userListSelect,
  });
  return serializeUserRow(updated);
}

export async function deleteUser(
  id: string,
  requesterId: string,
  requesterRole: Role
) {
  if (id === requesterId) {
    throw new Error("You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  if (user.role === Role.ADMIN) {
    if (requesterRole !== Role.ADMIN) {
      throw new Error("Only admins can delete admin accounts");
    }
    const otherAdmins = await prisma.user.count({
      where: { role: Role.ADMIN, id: { not: id } },
    });
    if (otherAdmins === 0) {
      throw new Error("Cannot delete the last admin account");
    }
  }

  if (requesterRole === Role.MANAGER && user.role === Role.ADMIN) {
    throw new Error("Managers cannot delete admin accounts");
  }

  const createdCount = await prisma.location.count({ where: { createdById: id } });
  if (createdCount > 0) {
    throw new Error(
      `Cannot delete: this user created ${createdCount} location(s). Reassign or remove them first.`
    );
  }

  await prisma.location.updateMany({
    where: { assignedRepId: id },
    data: { assignedRepId: null },
  });

  await prisma.userCity.deleteMany({ where: { userId: id } });
  await prisma.activity.deleteMany({ where: { userId: id } });
  await prisma.notification.deleteMany({ where: { userId: id } });

  return prisma.user.delete({ where: { id } });
}

export async function getSalesReps() {
  return prisma.user.findMany({
    where: { role: { in: [Role.SALES_REP, Role.MANAGER] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      assignedCities: {
        include: {
          city: {
            select: {
              id: true,
              name: true,
              stateId: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export { ActivityType };
