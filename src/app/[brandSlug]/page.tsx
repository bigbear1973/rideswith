import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isReservedSlug } from '@/lib/reserved-slugs';

// Force dynamic rendering - database queries can't run at build time
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ brandSlug: string }>;
}

export default async function BrandVanityPage({ params }: PageProps) {
  const { brandSlug } = await params;

  // Check if this is a reserved slug (should be handled by other routes)
  if (isReservedSlug(brandSlug)) {
    notFound();
  }

  // Check if a brand exists with this slug
  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
    select: { slug: true },
  });

  if (!brand) {
    notFound();
  }

  // Redirect to the full community URL
  // This ensures the actual page component handles rendering
  redirect(`/communities/${brandSlug}`);
}
