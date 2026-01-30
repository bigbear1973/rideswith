import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      type: true,
      logo: true,
      backdrop: true,
      slogan: true,
      _count: {
        select: {
          chapters: true,
        },
      },
    },
  });

  if (!brand) {
    return {
      title: 'Community Not Found | RidesWith',
    };
  }

  const typeLabel = brand.type === 'BRAND' ? 'Brand' : brand.type === 'CLUB' ? 'Club' : brand.type === 'TEAM' ? 'Team' : 'Group';

  const metaDescription = brand.description
    ? brand.description.slice(0, 155) + (brand.description.length > 155 ? '...' : '')
    : `${brand.name} is a cycling ${typeLabel.toLowerCase()} on RidesWith${brand.slogan ? `. ${brand.slogan}` : ''}. Join group rides and connect with fellow cyclists.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';
  const communityUrl = `${baseUrl}/communities/${slug}`;
  const ogImage = brand.backdrop || brand.logo || `${baseUrl}/og-default.png`;

  return {
    title: `${brand.name} | RidesWith`,
    description: metaDescription,
    openGraph: {
      title: `${brand.name} - Cycling ${typeLabel}`,
      description: metaDescription,
      url: communityUrl,
      siteName: 'RidesWith',
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: brand.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand.name} - Cycling ${typeLabel}`,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: communityUrl,
    },
  };
}
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Users,
  UsersRound,
  Bike,
  Plus,
  Globe,
  ExternalLink,
  BadgeCheck,
  Settings,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Building2,
  Trophy,
  ChevronLeft,
} from "lucide-react";
import { CopyableUrl } from "@/components/ui/copyable-url";
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

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBrand(slug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      chapters: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  slug: true,
                },
              },
            },
            orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          },
          _count: {
            select: {
              rides: {
                where: {
                  status: "PUBLISHED",
                  date: { gte: new Date() },
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return brand;
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const [brand, session] = await Promise.all([getBrand(slug), auth()]);

  if (!brand) {
    notFound();
  }

  const isOwner = session?.user?.id === brand.createdBy?.id;
  const totalMembers = brand.chapters.reduce((sum, c) => sum + c.memberCount, 0);
  const totalUpcomingRides = brand.chapters.reduce(
    (sum, c) => sum + c._count.rides,
    0
  );
  const totalRides = brand.chapters.reduce((sum, c) => sum + c.rideCount, 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-[120px]">

        {/* Left Column - Chapters List */}
        <main>
          {/* Back link */}
          <Link
            href="/communities"
            className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Communities
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="label-editorial">Chapters</span>
            {isOwner && (
              <Link
                href={`/communities/${brand.slug}/edit`}
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            )}
          </div>

          {/* Chapters List */}
          <div className="w-full border-t border-border">
            {brand.chapters.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No chapters yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Be the first to start a {brand.name} chapter in your city.
                </p>
                <Link href={`/communities/${brand.slug}/create-chapter`} className="cta-link">
                  <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                    <Plus className="w-2.5 h-2.5" />
                  </div>
                  Start a Chapter
                </Link>
              </div>
            ) : (
              <>
                {brand.chapters.map((chapter) => {
                  const owner = chapter.members.find((m) => m.role === "OWNER" || m.role === "LEAD");

                  return (
                    <Link
                      key={chapter.id}
                      href={`/communities/${brand.slug}/${chapter.slug}`}
                      className="list-item-editorial group"
                    >
                      {/* City Initial */}
                      <div className="hidden md:flex flex-col items-center justify-center">
                        <span className="text-2xl font-normal uppercase">
                          {chapter.city.slice(0, 2)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="pr-6">
                        <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          {chapter.city}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg md:text-[22px] font-normal uppercase">
                            {brand.name} {chapter.name}
                          </span>
                          {chapter._count.rides > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: brand.primaryColor || undefined,
                                color: brand.primaryColor ? "white" : undefined,
                              }}
                            >
                              {chapter._count.rides} upcoming
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                          <span className="after:content-['•'] after:ml-3 after:opacity-40">
                            {chapter.memberCount} {chapter.memberCount === 1 ? 'Ambassador' : 'Ambassadors'}
                          </span>
                          <span className="after:content-['•'] after:ml-3 after:opacity-40">
                            {chapter.rideCount} {chapter.rideCount === 1 ? 'Ride' : 'Rides'}
                          </span>
                          {owner && (
                            <span className="flex items-center gap-1">
                              <BadgeCheck className="h-3 w-3 text-blue-500" />
                              {owner.user.name}
                            </span>
                          )}
                        </div>

                        {/* Chapter Members Avatars */}
                        {chapter.members.length > 0 && (
                          <div className="flex -space-x-2 mt-3">
                            {chapter.members.slice(0, 4).map((member) => (
                              <Avatar
                                key={member.id}
                                className="h-7 w-7 border-2 border-background"
                              >
                                <AvatarImage
                                  src={member.user.image || undefined}
                                  alt={member.user.name || ""}
                                />
                                <AvatarFallback className="text-xs">
                                  {member.user.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {chapter.members.length > 4 && (
                              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                                +{chapter.members.length - 4}
                              </div>
                            )}
                          </div>
                        )}
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

          {/* Start Chapter CTA - below chapters list */}
          <Link href={`/communities/${brand.slug}/create-chapter`} className="cta-link mt-8">
            <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
              <Plus className="w-2.5 h-2.5" />
            </div>
            Start a Chapter
          </Link>
        </main>

        {/* Right Column - Community Info */}
        <aside className="lg:sticky lg:top-10 order-first lg:order-last">
          {/* Community Header */}
          <div className="flex items-start gap-6 mb-8">
            {brand.logo ? (
              <BrandLogo
                logo={brand.logo}
                logoDark={brand.logoDark}
                name={brand.name}
                primaryColor={brand.primaryColor}
                className="h-20 w-20"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold">
                {brand.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-normal uppercase tracking-tight">
                  {brand.name}
                </h1>
                {brand.type && COMMUNITY_TYPE_LABELS[brand.type] && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${COMMUNITY_TYPE_LABELS[brand.type].color}`}
                  >
                    {COMMUNITY_TYPE_LABELS[brand.type].label}
                  </Badge>
                )}
              </div>
              {brand.slogan && (
                <p className="text-sm text-muted-foreground italic">
                  {brand.slogan}
                </p>
              )}
            </div>
          </div>

          {/* Community URL */}
          <div className="mb-6">
            <CopyableUrl
              url={`https://rideswith.com/${brand.slug}`}
              displayUrl={`rideswith.com/${brand.slug}`}
            />
          </div>

          {/* Description */}
          {brand.description && (
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 whitespace-pre-line max-w-[420px]">
              {brand.description}
            </p>
          )}

          {/* Website */}
          {brand.domain && (
            <a
              href={brand.domain.startsWith('http') ? brand.domain : `https://${brand.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <Globe className="h-4 w-4" />
              {brand.domain.replace(/^https?:\/\//, '')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Social Links */}
          {(brand.instagram || brand.twitter || brand.facebook || brand.strava || brand.youtube) && (
            <div className="flex items-center gap-4 mb-8">
              {brand.instagram && (
                <a
                  href={brand.instagram.startsWith('http') ? brand.instagram : `https://instagram.com/${brand.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {brand.twitter && (
                <a
                  href={brand.twitter.startsWith('http') ? brand.twitter : `https://x.com/${brand.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="X / Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {brand.facebook && (
                <a
                  href={brand.facebook.startsWith('http') ? brand.facebook : `https://facebook.com/${brand.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {brand.strava && (
                <a
                  href={brand.strava}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Strava Club"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </a>
              )}
              {brand.youtube && (
                <a
                  href={brand.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          )}

          {/* Stats - hidden on mobile */}
          <div className="hidden md:block">
            <span className="label-editorial block mb-4">Community Stats</span>

            <div className="stat-row">
              <span className="stat-value">{brand.chapters.length}</span>
              <span className="stat-label">Chapters</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{totalMembers}</span>
              <span className="stat-label">Ambassadors</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{totalUpcomingRides}</span>
              <span className="stat-label">Upcoming Rides</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{totalRides}</span>
              <span className="stat-label">Total Rides</span>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
