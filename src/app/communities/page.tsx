import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, Plus, UsersRound, Trophy, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const COMMUNITY_TYPE_LABELS: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  BRAND: { label: "Brand", icon: Building2, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  CLUB: { label: "Club", icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  TEAM: { label: "Team", icon: Trophy, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  GROUP: { label: "Group", icon: UsersRound, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
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
    include: {
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

          {/* Community List */}
          <div className="w-full border-t border-border">
            {brands.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No communities yet</p>
                <p className="text-sm text-muted-foreground mb-6">Be the first to create a brand, club, or group</p>
                <Link href="/communities/create" className="cta-link">
                  <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                    <Plus className="w-2.5 h-2.5" />
                  </div>
                  Create Your Community
                </Link>
              </div>
            ) : (
              <>
                {brands.map((brand) => {
                  const memberCount = brand.chapters.reduce((sum, c) => sum + c.memberCount, 0);
                  const TypeIcon = brand.type && COMMUNITY_TYPE_LABELS[brand.type]?.icon;

                  return (
                    <Link
                      key={brand.id}
                      href={`/communities/${brand.slug}`}
                      className="list-item-editorial group"
                    >
                      {/* Logo */}
                      <div className="hidden md:flex items-center justify-center">
                        <BrandLogo
                          logo={brand.logo}
                          logoDark={brand.logoDark}
                          name={brand.name}
                          primaryColor={brand.primaryColor}
                          className="h-10 w-10"
                        />
                      </div>

                      {/* Content */}
                      <div className="pr-6">
                        {/* Mobile: Show type label */}
                        {brand.type && COMMUNITY_TYPE_LABELS[brand.type] && (
                          <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {COMMUNITY_TYPE_LABELS[brand.type].label}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg md:text-[22px] font-normal uppercase">
                            {brand.name}
                          </span>
                          {brand.type && COMMUNITY_TYPE_LABELS[brand.type] && (
                            <Badge
                              variant="secondary"
                              className={`hidden md:inline-flex text-xs ${COMMUNITY_TYPE_LABELS[brand.type].color}`}
                            >
                              {COMMUNITY_TYPE_LABELS[brand.type].label}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                          <span className="after:content-['•'] after:ml-3 after:opacity-40">
                            {brand._count.chapters} {brand._count.chapters === 1 ? 'Chapter' : 'Chapters'}
                          </span>
                          <span className="after:content-['•'] after:ml-3 after:opacity-40">
                            {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                          </span>
                          {brand.chapters.length > 0 && (
                            <span>
                              {brand.chapters.slice(0, 3).map(c => c.city).join(', ')}
                              {brand.chapters.length > 3 && ` +${brand.chapters.length - 3}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow button */}
                      <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                        <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Create Community CTA - below list */}
          <Link href="/communities/create" className="cta-link mt-8">
            <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
              <Plus className="w-2.5 h-2.5" />
            </div>
            Create Community
          </Link>
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
