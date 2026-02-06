import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { CommunitiesList } from "./communities-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Communities | RidesWith",
  description: "Discover cycling communities, clubs, teams, and brands on RidesWith. Find local chapters, join group rides, and connect with fellow cyclists.",
  openGraph: {
    title: "Communities | RidesWith",
    description: "Discover cycling communities, clubs, teams, and brands on RidesWith. Find local chapters, join group rides, and connect with fellow cyclists.",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://rideswith.com"}/communities`,
    siteName: "RidesWith",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://rideswith.com"}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "RidesWith Communities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Communities | RidesWith",
    description: "Discover cycling communities, clubs, teams, and brands on RidesWith. Find local chapters, join group rides, and connect with fellow cyclists.",
    images: [`${process.env.NEXT_PUBLIC_APP_URL || "https://rideswith.com"}/og-default.png`],
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://rideswith.com"}/communities`,
  },
};

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

async function getBrands() {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      discipline: true,
      logo: true,
      logoDark: true,
      primaryColor: true,
      chapters: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          memberCount: true,
          rideCount: true,
        },
      },
      _count: {
        select: {
          chapters: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return brands;
}

export default async function CommunitiesPage() {
  const brands = await getBrands();

  // Calculate totals across all brands
  const totalChapters = brands.reduce((sum, b) => sum + b._count.chapters, 0);
  const totalMembers = brands.reduce(
    (sum, b) => sum + b.chapters.reduce((s, c) => s + c.memberCount, 0),
    0
  );
  const totalRides = brands.reduce(
    (sum, b) => sum + b.chapters.reduce((s, c) => s + c.rideCount, 0),
    0
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-[120px]">

        {/* Left Column - Community List */}
        <main>
          <span className="label-editorial block mb-6">Communities</span>
          <h1 className="heading-display mb-10">
            Find your<br />cycling tribe.
          </h1>

          <CommunitiesList brands={brands} />
        </main>

        {/* Right Column - Sidebar (hidden on mobile) */}
        <aside className="hidden lg:block lg:sticky lg:top-10 order-first lg:order-last">
          <span className="label-editorial block mb-6">About Communities</span>

          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-[420px]">
            Communities bring cyclists together. Whether you&apos;re part of a commercial brand,
            a local cycling club, a racing team, or an informal riding group, RidesWith helps
            you organize and grow.
          </p>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-[420px]">
            Each community can have multiple chapters in different cities, making it easy to
            coordinate rides across regions while maintaining a cohesive identity.
          </p>

          <Link href="/about" className="cta-link">
            <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
              <ArrowIcon className="w-2.5 h-2.5 stroke-foreground" />
            </div>
            Learn More
          </Link>

          {/* Stats */}
          <div className="mt-16">
            <span className="label-editorial block mb-4">Platform Stats</span>

            <div className="stat-row">
              <span className="stat-value">{brands.length}</span>
              <span className="stat-label">Communities</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{totalChapters}</span>
              <span className="stat-label">Chapters</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{totalMembers}</span>
              <span className="stat-label">Members</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{totalRides}</span>
              <span className="stat-label">Rides</span>
            </div>
          </div>

          {/* CTA for creating */}
          <div className="mt-12">
            <span className="label-editorial block mb-4">Start Your Community</span>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-[420px]">
              Have a cycling brand, club, or group? Create your community and start organizing rides today.
            </p>
            <Link href="/communities/create" className="cta-link">
              <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                <Plus className="w-2.5 h-2.5" />
              </div>
              Create Community
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
