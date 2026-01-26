// Script to fix malformed domain URLs in the database
// Run with: DATABASE_URL="your-railway-url" node scripts/fix-domain-urls.mjs
// Get DATABASE_URL from Railway dashboard -> Variables

import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  console.error('Run with: DATABASE_URL="postgresql://..." node scripts/fix-domain-urls.mjs');
  process.exit(1);
}

const prisma = new PrismaClient();

function cleanDomain(domain) {
  if (!domain) return null;

  // Remove any protocol (including malformed ones like https://https//)
  let cleaned = domain
    .replace(/^(https?:\/\/)+/gi, '')  // Remove one or more http(s)://
    .replace(/^\/+/g, '')               // Remove leading slashes
    .replace(/^www\./i, '')             // Remove www.
    .replace(/\/$/g, '')                // Remove trailing slash
    .toLowerCase();

  return cleaned || null;
}

async function fixDomainUrls() {
  console.log('Fetching brands with domains...');

  const brands = await prisma.brand.findMany({
    where: {
      domain: { not: null }
    },
    select: {
      id: true,
      name: true,
      domain: true,
    }
  });

  console.log(`Found ${brands.length} brands with domains\n`);

  let fixedCount = 0;

  for (const brand of brands) {
    const cleaned = cleanDomain(brand.domain);

    if (cleaned !== brand.domain) {
      console.log(`Fixing "${brand.name}":`);
      console.log(`  Before: ${brand.domain}`);
      console.log(`  After:  ${cleaned}`);

      await prisma.brand.update({
        where: { id: brand.id },
        data: { domain: cleaned }
      });

      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} brand domains`);
}

fixDomainUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
