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
    { name: "United States", states: ["California", "Texas", "New York"] },
    { name: "Canada", states: ["Ontario", "British Columbia", "Quebec"] },
  ];

  for (const { name, states } of countries) {
    const country = await prisma.country.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    for (const stateName of states) {
      await prisma.state.upsert({
        where: { name_countryId: { name: stateName, countryId: country.id } },
        update: {},
        create: { name: stateName, countryId: country.id },
      });
    }
  }

  console.log("Seeded countries and states");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
