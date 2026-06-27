/**
 * One-time migration: contactMode (single) → contactModes (array) + contactEmail/contactPhone.
 * Run after `prisma db push`: npm run db:migrate-location-contact
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type RawLocation = {
  _id: { $oid: string };
  contactMode?: string | null;
  contactModes?: string[];
};

async function main() {
  const result = (await prisma.$runCommandRaw({
    find: "Location",
    filter: { contactMode: { $exists: true } },
  })) as { cursor?: { firstBatch?: RawLocation[] } };

  const docs = result.cursor?.firstBatch ?? [];
  let migrated = 0;

  for (const doc of docs) {
    const modes = doc.contactMode ? [doc.contactMode] : doc.contactModes ?? [];

    await prisma.$runCommandRaw({
      update: "Location",
      updates: [
        {
          q: { _id: doc._id },
          u: {
            $set: { contactModes: modes },
            $unset: { contactMode: "" },
          },
        },
      ],
    });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} location(s) from contactMode to contactModes`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
