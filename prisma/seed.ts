import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import canadaProvinces from "./data/canada-provinces.json";

const prisma = new PrismaClient();

const LEGACY_ADMIN_EMAILS = ["admin@dixtrail.com", "admin@trail.com"];
const CITY_BATCH_SIZE = 500;

async function purgeUser(userId: string, reassignCreatedLocationsToId?: string) {
  if (reassignCreatedLocationsToId) {
    await prisma.location.updateMany({
      where: { createdById: userId },
      data: { createdById: reassignCreatedLocationsToId },
    });
  }

  await prisma.location.updateMany({
    where: { assignedRepId: userId },
    data: { assignedRepId: null },
  });
  await prisma.userCity.deleteMany({ where: { userId } });
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

async function removeLegacyAdmins() {
  for (const email of LEGACY_ADMIN_EMAILS) {
    const legacy = await prisma.user.findUnique({ where: { email } });
    if (!legacy) continue;

    const replacementAdmin = await prisma.user.findFirst({
      where: { role: Role.ADMIN, id: { not: legacy.id } },
      orderBy: { createdAt: "asc" },
    });

    if (!replacementAdmin) {
      console.log(`Skipped removing ${email}: no other admin account exists`);
      continue;
    }

    await purgeUser(legacy.id, replacementAdmin.id);
    console.log(`Removed legacy admin: ${email}`);
  }
}

async function seedOptionalAdmin() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  if (!adminEmail) return;

  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim() || "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: process.env.SEED_ADMIN_PASSWORD ? { password: passwordHash } : {},
    create: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "Admin User",
      email: adminEmail,
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);
}

async function seedCitiesForState(stateId: string, cityNames: string[]) {
  const existing = await prisma.city.findMany({
    where: { stateId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((city) => city.name));
  const missing = cityNames.filter((name) => !existingNames.has(name));

  for (let i = 0; i < missing.length; i += CITY_BATCH_SIZE) {
    const batch = missing.slice(i, i + CITY_BATCH_SIZE);
    await prisma.city.createMany({
      data: batch.map((name) => ({ name, stateId })),
    });
  }

  return missing.length;
}

async function seedTerritories() {
  const countries = [
    {
      name: "United States",
      states: [
        { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego"] },
        { name: "Texas", cities: ["Houston", "Dallas", "Austin"] },
        { name: "New York", cities: ["New York City", "Buffalo", "Albany"] },
      ],
    },
    {
      name: "Canada",
      states: canadaProvinces,
    },
  ];

  let totalCitiesAdded = 0;

  for (const { name, states } of countries) {
    const country = await prisma.country.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    for (const stateEntry of states) {
      const state = await prisma.state.upsert({
        where: { name_countryId: { name: stateEntry.name, countryId: country.id } },
        update: {},
        create: { name: stateEntry.name, countryId: country.id },
      });

      totalCitiesAdded += await seedCitiesForState(state.id, stateEntry.cities);
    }
  }

  const canadaCityCount = canadaProvinces.reduce(
    (sum, province) => sum + province.cities.length,
    0
  );
  console.log(
    `Seeded territories: Canada has ${canadaProvinces.length} provinces/territories and ${canadaCityCount} cities (${totalCitiesAdded} new this run)`
  );
}

async function main() {
  await removeLegacyAdmins();
  await seedOptionalAdmin();
  await seedTerritories();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
