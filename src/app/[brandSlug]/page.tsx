import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isReservedSlug } from '@/lib/reserved-slugs';

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

// Generate static params for known brands (optional optimization)
export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({
    select: { slug: true },
  });

  return brands
    .filter((brand) => !isReservedSlug(brand.slug))
    .map((brand) => ({
      brandSlug: brand.slug,
    }));
}
