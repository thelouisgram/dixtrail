import prisma from "@/lib/prisma";

export async function getCountries() {
  return prisma.country.findMany({
    include: { _count: { select: { states: true, locations: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCountry(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Country name is required");

  const existing = await prisma.country.findUnique({ where: { name: trimmed } });
  if (existing) throw new Error("Country already exists");

  return prisma.country.create({
    data: { name: trimmed },
    include: { _count: { select: { states: true, locations: true } } },
  });
}

export async function getStates(countryId?: string) {
  return prisma.state.findMany({
    where: countryId ? { countryId } : undefined,
    include: { country: true, _count: { select: { locations: true } } },
    orderBy: { name: "asc" },
  });
}

export async function deleteCountry(id: string) {
  const country = await prisma.country.findUnique({
    where: { id },
    include: { _count: { select: { locations: true, states: true } } },
  });
  if (!country) throw new Error("Country not found");

  if (country._count.locations > 0) {
    throw new Error(
      `Cannot delete: ${country._count.locations} location(s) use this country. Remove or reassign them first.`
    );
  }

  await prisma.state.deleteMany({ where: { countryId: id } });
  return prisma.country.delete({ where: { id } });
}

export async function createState(name: string, countryId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("State name is required");

  const country = await prisma.country.findUnique({ where: { id: countryId } });
  if (!country) throw new Error("Country not found");

  const existing = await prisma.state.findUnique({
    where: { name_countryId: { name: trimmed, countryId } },
  });
  if (existing) throw new Error("State already exists in this country");

  return prisma.state.create({
    data: { name: trimmed, countryId },
    include: { country: true, _count: { select: { locations: true } } },
  });
}
