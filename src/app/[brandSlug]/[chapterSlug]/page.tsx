import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isReservedSlug } from '@/lib/reserved-slugs';

// Force dynamic rendering - database queries can't run at build time
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ brandSlug: string; chapterSlug: string }>;
}

export default async function ChapterVanityPage({ params }: PageProps) {
  const { brandSlug, chapterSlug } = await params;

  // Check if this is a reserved slug
  if (isReservedSlug(brandSlug)) {
    notFound();
  }

  // Check if a brand exists with this slug
  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
    select: {
      slug: true,
      chapters: {
        where: { slug: chapterSlug },
        select: { slug: true },
      },
    },
  });

  if (!brand) {
    notFound();
  }

  // Check if chapter exists
  if (brand.chapters.length === 0) {
    notFound();
  }

  // Redirect to the full community/chapter URL
  redirect(`/communities/${brandSlug}/${chapterSlug}`);
}
