import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RouteEmbed, CommunityRoutes, CakeAndCoffee, LocationLink, RsvpSection, SidebarComments, AddToCalendar, LiveLocationBanner, ShareButton } from '@/components/rides';
import { SponsorCard } from '@/components/communities';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  Calendar,
  Clock,
  Users,
  Route,
  ChevronLeft,
  ArrowUpRight,
  Edit,
  MapPin,
} from 'lucide-react';

interface RidePageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: RidePageProps): Promise<Metadata> {
  const { id } = await params;

  const ride = await prisma.ride.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      date: true,
      locationName: true,
      locationAddress: true,
      distance: true,
      chapter: {
        select: {
          brand: {
            select: {
              name: true,
              backdrop: true,
            },
          },
        },
      },
    },
  });

  if (!ride) {
    return {
      title: 'Ride Not Found | RidesWith',
    };
  }

  const formattedDate = format(ride.date, 'EEEE, MMMM d, yyyy');
  const brandName = ride.chapter?.brand?.name;

  // Create a compelling description for search results
  const metaDescription = ride.description
    ? ride.description.slice(0, 155) + (ride.description.length > 155 ? '...' : '')
    : `Join this ${ride.distance ? `${ride.distance}km ` : ''}group cycling ride on ${formattedDate} starting from ${ride.locationName}${brandName ? ` with ${brandName}` : ''}.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com';
  const rideUrl = `${baseUrl}/rides/${id}`;
  const ogImage = ride.chapter?.brand?.backdrop || `${baseUrl}/og-default.png`;

  return {
    title: `${ride.title} | RidesWith`,
    description: metaDescription,
    openGraph: {
      title: ride.title,
      description: metaDescription,
      url: rideUrl,
      siteName: 'RidesWith',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ride.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ride.title,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: rideUrl,
    },
  };
}

// Helper function to format speed range display
function formatSpeedRange(paceMin: number | null, paceMax: number | null): string | null {
  if (paceMin !== null && paceMax !== null) {
    return `${paceMin}-${paceMax} km/h`;
  } else if (paceMin !== null) {
    return `${paceMin}+ km/h`;
  } else if (paceMax !== null) {
    return `Up to ${paceMax} km/h`;
  }
  return null;
}

// Helper to normalize domain to full URL (handles cases where domain already includes protocol)
function normalizeUrl(domain: string | null | undefined): string | null {
  if (!domain) return null;
  // Already has protocol
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain;
  }
  return `https://${domain}`;
}

export default async function RidePage({ params }: RidePageProps) {
  const { id } = await params;
  const session = await auth();

  if (!id) {
    notFound();
  }

  // Fetch ride from database
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          slug: true,
          memberCount: true,
          rideCount: true,
          members: {
            where: {
              role: { in: ['OWNER', 'ADMIN'] },
            },
            select: {
              userId: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  slug: true,
                },
              },
            },
            orderBy: {
              role: 'asc', // OWNER comes before ADMIN alphabetically
            },
          },
        },
      },
      chapter: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          sponsorLabel: true,
          hidePresentedBy: true,
          sponsors: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              name: true,
              website: true,
              logo: true,
              backdrop: true,
              primaryColor: true,
              description: true,
              displaySize: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              logoIcon: true,
              primaryColor: true,
              secondaryColor: true,
              backdrop: true,
              slogan: true,
              domain: true,
              sponsorLabel: true, // Used as fallback if chapter doesn't set its own
              hidePresentedBy: true, // Used as fallback if chapter doesn't set its own
            },
          },
        },
      },
      rsvps: {
        where: { status: { in: ['GOING', 'MAYBE'] } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      },
      _count: {
        select: {
          rsvps: true,
        },
      },
    },
  });

  if (!ride) {
    notFound();
  }

  // Count RSVPs by status
  const goingRsvps = await prisma.rsvp.count({
    where: { rideId: id, status: 'GOING' },
  });
  const maybeRsvps = await prisma.rsvp.count({
    where: { rideId: id, status: 'MAYBE' },
  });

  // Get current user's RSVP status
  let currentUserRsvpStatus: 'GOING' | 'MAYBE' | 'NOT_GOING' | null = null;
  if (session?.user?.id) {
    const userRsvp = await prisma.rsvp.findUnique({
      where: {
        rideId_userId: {
          rideId: id,
          userId: session.user.id,
        },
      },
    });
    currentUserRsvpStatus = userRsvp?.status ?? null;
  }

  const speedRange = formatSpeedRange(ride.paceMin, ride.paceMax);
  const isPastRide = new Date(ride.date) < new Date();

  // Brand info for branded rides
  const brand = ride.chapter?.brand;
  const chapter = ride.chapter;
  const hasBranding = !!brand;

  // Check if "Presented by" card should be hidden (chapter setting overrides brand)
  const hidePresentedBy = chapter?.hidePresentedBy ?? brand?.hidePresentedBy ?? false;

  // Check if current user can edit this ride
  const canEdit = session?.user?.id && ride.organizer.members.some(
    (member) => member.userId === session?.user?.id
  );

  // Format date and time
  const formattedDate = format(ride.date, 'EEEE, MMMM d, yyyy');
  const formattedDateShort = format(ride.date, 'EEE, MMM d').toUpperCase();
  const formattedStartTime = format(ride.date, 'h:mm a');
  const formattedEndTime = ride.endTime ? format(ride.endTime, 'h:mm a') : null;

  // Format attendees for the component
  const attendees = ride.rsvps.map((rsvp) => {
    const name = rsvp.user.name || rsvp.user.email?.split('@')[0] || 'User';
    return {
      id: rsvp.user.id,
      name,
      image: rsvp.user.image,
      slug: rsvp.user.slug,
      status: rsvp.status as 'GOING' | 'MAYBE' | 'NOT_GOING',
    };
  });

  // Build ride info text for copying
  const rideUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'}/rides/${id}`;
  // Shorten address: take first 2-3 parts (e.g., "Phoenix Park, Dublin" instead of full address)
  const shortAddress = ride.locationAddress.split(',').slice(0, 2).join(',').trim();
  // Only include short address if it's different from location name (avoid duplication)
  const showAddress = shortAddress.toLowerCase() !== ride.locationName.toLowerCase() &&
    !ride.locationName.toLowerCase().includes(shortAddress.toLowerCase()) &&
    !shortAddress.toLowerCase().includes(ride.locationName.toLowerCase());
  const rideInfoText = [
    `${ride.title}`,
    ``,
    `${formattedDate}`,
    `${formattedStartTime}${formattedEndTime ? ` - ${formattedEndTime}` : ''}`,
    ``,
    `${ride.locationName}`,
    showAddress ? shortAddress : null,
    ``,
    ride.distance ? `Distance: ${ride.distance} km` : null,
    ride.elevation ? `Elevation: ${ride.elevation} m` : null,
    speedRange ? `Speed: ${speedRange}` : null,
    ride.terrain ? `Terrain: ${ride.terrain}` : null,
    ``,
    ride.description ? `${ride.description}` : null,
    ``,
    `Join the ride: ${rideUrl}`,
  ].filter(Boolean).join('\n');

  // JSON-LD structured data for the ride (Event schema)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: ride.title,
    description: ride.description || `Group cycling ride starting from ${ride.locationName}`,
    startDate: ride.date.toISOString(),
    endDate: ride.endTime?.toISOString() || new Date(ride.date.getTime() + 3 * 60 * 60 * 1000).toISOString(), // Default 3 hours
    location: {
      '@type': 'Place',
      name: ride.locationName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: ride.locationAddress,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: ride.latitude,
        longitude: ride.longitude,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: brand?.name || ride.organizer.name,
      url: normalizeUrl(brand?.domain) || rideUrl,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(ride.maxAttendees && { maximumAttendeeCapacity: ride.maxAttendees }),
    ...(brand?.backdrop && { image: brand.backdrop }),
    sport: 'Cycling',
    url: rideUrl,
  };

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Brand Header - shown for branded rides */}
      {hasBranding && brand && chapter && brand.domain && (
        <a
          href={normalizeUrl(brand.domain)!}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {/* Backdrop image - full width, no overlay - hidden on mobile */}
          {brand.backdrop && (
            <div
              className="hidden md:block h-40 md:h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${brand.backdrop})` }}
            />
          )}
          {/* Brand info below image */}
          <div
            className="py-4"
            style={{ backgroundColor: brand.primaryColor || '#1a1a1a' }}
          >
            <div className="mx-auto max-w-[1400px] px-6 md:px-[60px]">
              <div className="flex items-center gap-4">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-12 w-12 object-contain rounded-lg bg-white p-1.5"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold text-white">
                    {brand.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-white">
                  <p className="text-xs uppercase tracking-wider opacity-70">Presented by</p>
                  <p className="font-semibold uppercase">{brand.name}</p>
                  {brand.slogan && (
                    <p className="text-sm opacity-80 italic">{brand.slogan}</p>
                  )}
                </div>
                <ArrowUpRight className="h-5 w-5 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </a>
      )}

      {/* Mobile Header */}
      <div className="sticky top-14 z-30 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="hover:bg-foreground hover:text-background">
            <Link href={hasBranding && brand && chapter ? `/communities/${brand.slug}/${chapter.slug}` : '/discover'}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            {hasBranding && brand && chapter ? (
              <Link
                href={`/communities/${brand.slug}/${chapter.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground block truncate uppercase tracking-wider"
              >
                {brand.name} {chapter.name}
              </Link>
            ) : null}
            <span className="font-medium truncate block uppercase">{ride.title}</span>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" asChild className="border-foreground/20 hover:bg-foreground hover:text-background">
              <Link href={`/rides/${id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px]">
        <div className={hasBranding && brand && chapter && brand.domain ? "lg:grid lg:grid-cols-[1fr_320px] lg:gap-[60px]" : ""}>
          {/* Main Content */}
          <div className="space-y-8">
            {/* Back link - Desktop */}
            <Link
              href={hasBranding && brand && chapter ? `/communities/${brand.slug}/${chapter.slug}` : '/discover'}
              className="hidden lg:inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {hasBranding && brand && chapter ? `Back to ${brand.name} ${chapter.name}` : 'Back to rides'}
            </Link>

            {/* Title Section */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="label-editorial">{formattedDateShort}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <ShareButton
                    rideInfo={rideInfoText}
                    rideUrl={rideUrl}
                    rideTitle={ride.title}
                  />
                  {canEdit && (
                    <Button variant="outline" size="sm" asChild className="hidden lg:flex border-foreground/20 hover:bg-foreground hover:text-background uppercase text-xs">
                      <Link href={`/rides/${id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <h1 className="heading-display">
                {ride.title}
              </h1>
            </div>

            {/* Live Location Banner - shown when ride is live */}
            {ride.isLive && (
              <LiveLocationBanner
                liveLocationUrl={ride.liveLocationUrl}
                rideName={ride.title}
              />
            )}

            {/* Ride Stats - Editorial Style */}
            <div className="border-t border-b border-border py-6 space-y-4">
              {/* Date & Time */}
              <div className="stat-row">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">Date & Time</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {formattedStartTime}
                    {formattedEndTime && ` - ${formattedEndTime}`}
                  </p>
                  {!isPastRide && (
                    <AddToCalendar
                      title={ride.title}
                      description={ride.description}
                      date={ride.date}
                      endTime={ride.endTime}
                      locationName={ride.locationName}
                      locationAddress={ride.locationAddress}
                      rideUrl={rideUrl}
                    />
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="stat-row">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">Start Location</span>
                </div>
                <div className="text-right">
                  <LocationLink
                    locationName={ride.locationName}
                    locationAddress={ride.locationAddress}
                    latitude={ride.latitude}
                    longitude={ride.longitude}
                    compact
                  />
                </div>
              </div>

              {/* Distance */}
              {ride.distance && (
                <div className="stat-row">
                  <div className="flex items-center gap-3">
                    <Route className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Distance</span>
                  </div>
                  <span className="stat-value">{ride.distance} km</span>
                </div>
              )}

              {/* Elevation */}
              {ride.elevation && (
                <div className="stat-row">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold">↗</span>
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Elevation</span>
                  </div>
                  <span className="stat-value">{ride.elevation} m</span>
                </div>
              )}

              {/* Speed */}
              {speedRange && (
                <div className="stat-row">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Speed</span>
                  </div>
                  <span className="stat-value">{speedRange}</span>
                </div>
              )}

              {/* Terrain */}
              {ride.terrain && (
                <div className="stat-row">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold">◈</span>
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Terrain</span>
                  </div>
                  <span className="font-medium">{ride.terrain}</span>
                </div>
              )}

              {/* Max Riders */}
              {ride.maxAttendees && (
                <div className="stat-row">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground uppercase tracking-wider">Max Riders</span>
                  </div>
                  <span className="stat-value">{ride.maxAttendees}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {ride.description && (
              <div>
                <span className="label-editorial block mb-4">About This Ride</span>
                <div className="text-muted-foreground leading-relaxed">
                  {ride.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 last:mb-0 whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Route Embed - show if routeUrl is provided */}
            {ride.routeUrl && <RouteEmbed routeUrl={ride.routeUrl} />}

            {/* Community Route Links */}
            <CommunityRoutes rideId={id} />

            {/* Discussion Section */}
            <SidebarComments rideId={id} isOrganizer={!!canEdit} />

            {/* RSVP Section */}
            <div className="border-t border-border pt-8">
              <span className="label-editorial block mb-4">Join This Ride</span>

              {/* Hosted by */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span>Hosted by</span>
                {ride.organizer.members[0]?.user ? (
                  <Link
                    href={ride.organizer.members[0].user.slug ? `/u/${ride.organizer.members[0].user.slug}` : '#'}
                    className="font-medium text-foreground hover:underline"
                  >
                    {ride.organizer.members[0].user.name || ride.organizer.name}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{ride.organizer.name}</span>
                )}
              </div>

              <RsvpSection
                rideId={id}
                currentUserRsvpStatus={currentUserRsvpStatus}
                attendees={attendees}
                totalGoing={goingRsvps}
                totalMaybe={maybeRsvps}
                maxAttendees={ride.maxAttendees}
                isPastRide={isPastRide}
              />
            </div>

            {/* Cake & Coffee Stop - Post-ride social section */}
            <CakeAndCoffee rideId={id} rideDate={ride.date} isOrganizer={!!canEdit} />

            {/* Mobile Sponsors Section - shown below main content on mobile for branded rides */}
            {hasBranding && brand && chapter && (
              <div className="lg:hidden">
                {(() => {
                  const chapterSponsors = chapter?.sponsors || [];
                  const sponsorLabel = chapter?.sponsorLabel || brand.sponsorLabel || 'sponsors';
                  const labelText = sponsorLabel === 'partners' ? 'Our Partners' : sponsorLabel === 'ads' ? 'Ads' : 'Our Sponsors';

                  if (chapterSponsors.length === 0) return null;

                  return (
                    <div className="space-y-4">
                      <span className="label-editorial">{labelText}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {chapterSponsors.map((sponsor) => (
                          <SponsorCard
                            key={sponsor.id}
                            sponsor={sponsor}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Sidebar - Desktop (only shows for branded rides) */}
          {hasBranding && brand && chapter && brand.domain && (
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {/* Brand Card - links to external brand site (can be hidden) */}
                {!hidePresentedBy && (
                  <a
                    href={normalizeUrl(brand.domain)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group border border-border rounded-md overflow-hidden hover:border-foreground transition-colors"
                  >
                    {/* Backdrop image */}
                    {brand.backdrop && (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${brand.backdrop})` }}
                      />
                    )}
                    {/* Brand info below image */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-12 w-12 object-contain rounded-lg bg-white dark:bg-neutral-800 border border-border p-1.5"
                          />
                        ) : (
                          <div
                            className="h-12 w-12 rounded-lg flex items-center justify-center text-lg font-bold text-white"
                            style={{ backgroundColor: brand.primaryColor || '#1a1a1a' }}
                          >
                            {brand.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Presented by</p>
                          <p className="font-semibold uppercase">{brand.name}</p>
                          {brand.slogan && (
                            <p className="text-xs text-muted-foreground italic line-clamp-2">{brand.slogan}</p>
                          )}
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </a>
                )}

                {/* Sponsors Section - chapter-specific sponsors only */}
                {(() => {
                  const chapterSponsors = chapter?.sponsors || [];
                  // Use chapter label if set, otherwise inherit from brand
                  const sponsorLabel = chapter?.sponsorLabel || brand.sponsorLabel || 'sponsors';
                  const labelText = sponsorLabel === 'partners' ? 'Our Partners' : sponsorLabel === 'ads' ? 'Ads' : 'Our Sponsors';

                  if (chapterSponsors.length === 0) return null;

                  return (
                    <div className="space-y-3">
                      <span className="label-editorial">{labelText}</span>
                      {chapterSponsors.map((sponsor) => (
                        <SponsorCard
                          key={sponsor.id}
                          sponsor={sponsor}
                        />
                      ))}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
