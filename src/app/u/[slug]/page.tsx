import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PublicProfilePageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      name: true,
      bio: true,
      image: true,
      location: true,
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });

  if (!user) {
    return {
      title: 'User Not Found | RidesWith',
    };
  }

  const displayName = user.name || 'Cyclist';
  const metaDescription = user.bio
    ? user.bio.slice(0, 155) + (user.bio.length > 155 ? '...' : '')
    : `${displayName}'s cycling profile on RidesWith${user.location ? ` from ${user.location}` : ''}. ${user._count.rsvps} rides attended.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';
  const profileUrl = `${baseUrl}/u/${slug}`;
  const ogImage = user.image || `${baseUrl}/og-default.png`;

  return {
    title: `${displayName} | RidesWith`,
    description: metaDescription,
    openGraph: {
      title: `${displayName} - Cyclist Profile`,
      description: metaDescription,
      url: profileUrl,
      siteName: 'RidesWith',
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: displayName,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${displayName} - Cyclist Profile`,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: profileUrl,
    },
  };
}
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Route,
  ChevronLeft,
} from 'lucide-react';
import { SocialIconsDisplay } from '@/components/profile/social-links-picker';
import { CopyableUrl } from '@/components/ui/copyable-url';

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      slug: true,
      bio: true,
      location: true,
      showEmail: true,
      createdAt: true,
      // Social links
      instagram: true,
      strava: true,
      twitter: true,
      youtube: true,
      tiktok: true,
      patreon: true,
      kofi: true,
      website: true,
      // Relations
      rsvps: {
        where: { status: 'GOING' },
        include: {
          ride: {
            include: {
              organizer: {
                select: { id: true, name: true, slug: true },
              },
              _count: {
                select: { rsvps: { where: { status: 'GOING' } } },
              },
            },
          },
        },
        orderBy: { ride: { date: 'desc' } },
      },
      organizers: {
        include: {
          organizer: true,
        },
      },
      chapters: {
        include: {
          chapter: {
            include: {
              brand: {
                select: { name: true, slug: true, logo: true, logoIcon: true, primaryColor: true },
              },
              _count: {
                select: { rides: true, members: true },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const now = new Date();
  const upcomingRides = user.rsvps
    .filter((rsvp) => new Date(rsvp.ride.date) >= now)
    .sort((a, b) => new Date(a.ride.date).getTime() - new Date(b.ride.date).getTime())
    .slice(0, 5);
  const pastRides = user.rsvps
    .filter((rsvp) => new Date(rsvp.ride.date) < now)
    .slice(0, 10);

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.slice(0, 2).toUpperCase() || 'U';

  // Calculate stats
  const totalRides = user.rsvps.length;
  const totalDistance = pastRides.reduce((sum, rsvp) => sum + (rsvp.ride.distance || 0), 0);
  const communityCount = user.chapters.length;

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-[120px]">

        {/* Left Column - Ride Activity */}
        <main>
          {/* Back link */}
          <Link
            href="/discover"
            className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to rides
          </Link>

          {/* Upcoming Rides */}
          {upcomingRides.length > 0 && (
            <div className="mb-12">
              <span className="label-editorial block mb-6">Upcoming Rides</span>
              <div className="w-full border-t border-border">
                {upcomingRides.map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    href={`/rides/${rsvp.ride.id}`}
                    className="list-item-editorial group"
                  >
                    {/* Date */}
                    <div className="hidden md:flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground uppercase">
                        {format(new Date(rsvp.ride.date), 'MMM')}
                      </span>
                      <span className="text-2xl font-normal">
                        {format(new Date(rsvp.ride.date), 'd')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="pr-6">
                      <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {format(new Date(rsvp.ride.date), 'EEE, MMM d').toUpperCase()} • {format(new Date(rsvp.ride.date), 'h:mm a').toUpperCase()}
                      </div>
                      <div className="text-lg md:text-[22px] font-normal uppercase mb-1">
                        {rsvp.ride.title}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                        <span className="after:content-['•'] after:ml-3 after:opacity-40 hidden md:inline">
                          {format(new Date(rsvp.ride.date), 'h:mm a')}
                        </span>
                        <span className="after:content-['•'] after:ml-3 after:opacity-40">
                          {rsvp.ride.locationName}
                        </span>
                        {rsvp.ride.distance && (
                          <span>
                            {rsvp.ride.distance} km
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow button */}
                    <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                      <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Rides */}
          {pastRides.length > 0 && (
            <div className="mb-12">
              <span className="label-editorial block mb-6">Recent Rides</span>
              <div className="w-full border-t border-border">
                {pastRides.map((rsvp) => (
                  <Link
                    key={rsvp.id}
                    href={`/rides/${rsvp.ride.id}`}
                    className="list-item-editorial group opacity-70 hover:opacity-100"
                  >
                    {/* Date */}
                    <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(new Date(rsvp.ride.date), 'MMM d, yyyy')}
                    </div>

                    {/* Content */}
                    <div className="pr-6">
                      <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {format(new Date(rsvp.ride.date), 'MMM d, yyyy').toUpperCase()}
                      </div>
                      <div className="text-lg md:text-[22px] font-normal uppercase mb-1">
                        {rsvp.ride.title}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                        <span className="after:content-['•'] after:ml-3 after:opacity-40">
                          {rsvp.ride.organizer.name}
                        </span>
                        {rsvp.ride.distance && (
                          <span>
                            {rsvp.ride.distance} km
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow button */}
                    <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                      <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Communities */}
          {user.chapters.length > 0 && (
            <div>
              <span className="label-editorial block mb-6">Communities</span>
              <div className="w-full border-t border-border">
                {user.chapters.map((membership) => (
                  <Link
                    key={membership.id}
                    href={`/communities/${membership.chapter.brand?.slug}/${membership.chapter.slug}`}
                    className="list-item-editorial group"
                  >
                    {/* Logo */}
                    <div className="hidden md:flex items-center justify-center">
                      <Avatar className="h-10 w-10">
                        {membership.chapter.brand?.logo && (
                          <AvatarImage
                            src={membership.chapter.brand.logoIcon || membership.chapter.brand.logo}
                            style={{ backgroundColor: membership.chapter.brand.primaryColor || undefined }}
                          />
                        )}
                        <AvatarFallback className="text-xs">
                          {membership.chapter.city.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className="pr-6">
                      <div className="text-lg md:text-[22px] font-normal uppercase mb-1">
                        {membership.chapter.brand?.name} {membership.chapter.city}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                        <span className="after:content-['•'] after:ml-3 after:opacity-40">
                          {membership.chapter._count.rides} Rides
                        </span>
                        <span>
                          {membership.chapter._count.members} Members
                        </span>
                      </div>
                    </div>

                    {/* Arrow button */}
                    <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                      <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state if no rides */}
          {totalRides === 0 && user.chapters.length === 0 && (
            <div className="text-center py-16 border-t border-border">
              <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No ride activity yet</p>
              <p className="text-sm text-muted-foreground">This rider hasn&apos;t joined any rides</p>
            </div>
          )}
        </main>

        {/* Right Column - Profile Info */}
        <aside className="lg:sticky lg:top-10 order-first lg:order-last">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8">
            <Avatar className="h-20 w-20">
              {user.image && <AvatarImage src={user.image} alt={user.name || ''} />}
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-normal uppercase tracking-tight">
                {user.name || 'Anonymous Rider'}
              </h1>
              {user.location && (
                <p className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.location}
                </p>
              )}
            </div>
          </div>

          {/* Profile URL */}
          {user.slug && (
            <div className="mb-6">
              <CopyableUrl
                url={`https://rideswith.com/u/${user.slug}`}
                displayUrl={`rideswith.com/u/${user.slug}`}
              />
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 whitespace-pre-line max-w-[420px]">
              {user.bio}
            </p>
          )}

          {/* Email */}
          {user.showEmail && user.email && (
            <a
              href={`mailto:${user.email}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block mb-6"
            >
              {user.email}
            </a>
          )}

          {/* Social Links */}
          <SocialIconsDisplay
            links={{
              instagram: user.instagram,
              strava: user.strava,
              twitter: user.twitter,
              youtube: user.youtube,
              tiktok: user.tiktok,
              patreon: user.patreon,
              kofi: user.kofi,
              website: user.website,
            }}
            className="mb-6"
          />

          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-8">
            Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
          </p>

          {/* Stats */}
          <div>
            <span className="label-editorial block mb-4">Ride Stats</span>

            <div className="stat-row">
              <span className="stat-value">{totalRides}</span>
              <span className="stat-label">Rides Joined</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{Math.round(totalDistance)}</span>
              <span className="stat-label">km Ridden</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{communityCount}</span>
              <span className="stat-label">Communities</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
