import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@dixtrail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim() || "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: process.env.SEED_ADMIN_PASSWORD
      ? { password: passwordHash }
      : {},
    create: {
      name: process.env.SEED_ADMIN_NAME?.trim() || "Admin User",
      email: adminEmail,
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user ready: ${adminEmail}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("Default password: admin123 (set SEED_ADMIN_PASSWORD in .env to use a custom password)");
  }

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
      states: [
        { name: "Ontario", cities: ["Toronto", "Ottawa", "Hamilton"] },
        { name: "British Columbia", cities: ["Vancouver", "Victoria", "Surrey"] },
        { name: "Quebec", cities: ["Montreal", "Quebec City", "Laval"] },
      ],
    },
  ];

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

      for (const cityName of stateEntry.cities) {
        await prisma.city.upsert({
          where: { name_stateId: { name: cityName, stateId: state.id } },
          update: {},
          create: { name: cityName, stateId: state.id },
        });
      }
    }
  }

  console.log("Seeded countries, provinces/states, and cities");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
