import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string; chapter: string }>;
}

// Generate dynamic metadata for SEO - this runs on the server
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug, chapter: chapterSlug } = await params;

  // Find the brand first
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logo: true,
      backdrop: true,
      chapters: {
        where: { slug: chapterSlug },
        select: {
          name: true,
          city: true,
          memberCount: true,
          rideCount: true,
        },
        take: 1,
      },
    },
  });

  if (!brand || brand.chapters.length === 0) {
    return {
      title: 'Chapter Not Found | RidesWith',
    };
  }

  const chapter = brand.chapters[0];
  const metaDescription = `${brand.name} ${chapter.name} - Join group cycling rides in ${chapter.city}. ${chapter.rideCount} rides organized, ${chapter.memberCount} members.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';
  const chapterUrl = `${baseUrl}/communities/${slug}/${chapterSlug}`;
  const ogImage = brand.backdrop || brand.logo || `${baseUrl}/og-default.png`;

  return {
    title: `${brand.name} ${chapter.name} | RidesWith`,
    description: metaDescription,
    openGraph: {
      title: `${brand.name} ${chapter.name} - Group Rides in ${chapter.city}`,
      description: metaDescription,
      url: chapterUrl,
      siteName: 'RidesWith',
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${brand.name} ${chapter.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand.name} ${chapter.name} - Group Rides in ${chapter.city}`,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: chapterUrl,
    },
  };
}

export default function ChapterLayout({ children }: LayoutProps) {
  return children;
}
