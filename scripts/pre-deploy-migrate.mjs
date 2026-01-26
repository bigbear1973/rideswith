#!/usr/bin/env node

/**
 * Pre-deployment migration script
 * Converts old ChapterRole enum values (LEAD, AMBASSADOR) to new values (OWNER, ADMIN, MODERATOR)
 * Must run BEFORE prisma db push
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running pre-deployment migrations...');

  try {
    // Check if the old enum values exist in the database
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "ChapterMember"
      WHERE "role" IN ('LEAD', 'AMBASSADOR')
    `;

    const count = Number(result[0]?.count || 0);

    if (count > 0) {
      console.log(`Found ${count} records with old role values. Migrating...`);

      // Update LEAD -> OWNER
      const leadUpdated = await prisma.$executeRaw`
        UPDATE "ChapterMember" SET "role" = 'OWNER' WHERE "role" = 'LEAD'
      `;
      console.log(`Updated ${leadUpdated} LEAD -> OWNER`);

      // Update AMBASSADOR -> MODERATOR
      const ambassadorUpdated = await prisma.$executeRaw`
        UPDATE "ChapterMember" SET "role" = 'MODERATOR' WHERE "role" = 'AMBASSADOR'
      `;
      console.log(`Updated ${ambassadorUpdated} AMBASSADOR -> MODERATOR`);

      console.log('Migration completed successfully!');
    } else {
      console.log('No old role values found. Skipping migration.');
    }
  } catch (error) {
    // If the query fails (e.g., the new enum values don't exist yet), that's OK
    // The prisma db push will handle it
    if (error.message?.includes('invalid input value for enum')) {
      console.log('New enum values not yet in database. This is expected on first deploy.');
    } else {
      console.error('Migration error (non-fatal):', error.message);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Pre-deploy migration failed:', e);
  process.exit(1);
});
