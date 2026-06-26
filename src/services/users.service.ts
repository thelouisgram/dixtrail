import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { CreateUserInput } from "@/lib/validations";

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { assignedLocations: true, createdLocations: true } },
    },
    orderBy: { createdAt: "desc" },
  });
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

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function deleteUser(id: string, requesterId: string) {
  if (id === requesterId) {
    throw new Error("You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  if (user.role === Role.ADMIN) {
    throw new Error("Admin accounts cannot be deleted");
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

  return prisma.user.delete({ where: { id } });
}

export async function getSalesReps() {
  return prisma.user.findMany({
    where: { role: { in: [Role.SALES_REP, Role.MANAGER] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
