import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_INIT_USERNAME ?? "admin";
  const adminPlainPassword = process.env.ADMIN_INIT_PASSWORD ?? "Admin@1234";

  const passwordHash = await bcrypt.hash(adminPlainPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
    },
    create: {
      username: adminUsername,
      passwordHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorRole: "system",
      actionType: "seed.admin.upsert",
      targetType: "admin",
      targetId: admin.adminId,
      metadataJson: {
        username: admin.username,
      },
    },
  });

  console.log(`Seed complete. Initial admin username: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
