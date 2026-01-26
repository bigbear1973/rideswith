import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Set platform admin
  const platformAdminEmail = 'rogermbyrne@gmail.com';

  const user = await prisma.user.findUnique({
    where: { email: platformAdminEmail },
  });

  if (user) {
    if (user.role !== 'PLATFORM_ADMIN') {
      await prisma.user.update({
        where: { email: platformAdminEmail },
        data: { role: 'PLATFORM_ADMIN' },
      });
      console.log(`[Seed] Set ${platformAdminEmail} as PLATFORM_ADMIN`);
    } else {
      console.log(`[Seed] ${platformAdminEmail} is already PLATFORM_ADMIN`);
    }
  } else {
    console.log(`[Seed] User ${platformAdminEmail} not found - will be set as admin on first login`);
  }
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
