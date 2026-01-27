import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

interface RidePageProps {
  params: Promise<{ id: string }>;
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

  return (
    <div className="min-h-screen pb-8">
      {/* Brand Header - shown for branded rides */}
      {hasBranding && brand && chapter && brand.domain && (
        <a
          href={`https://${brand.domain}`}
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
            <div className="mx-auto max-w-6xl px-4">
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
                  <p className="text-xs opacity-70">Presented by</p>
                  <p className="font-semibold">{brand.name}</p>
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
      <div className="sticky top-14 z-30 bg-background border-b px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={hasBranding && brand && chapter ? `/communities/${brand.slug}/${chapter.slug}` : '/discover'}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            {hasBranding && brand && chapter ? (
              <Link
                href={`/communities/${brand.slug}/${chapter.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground block truncate"
              >
                {brand.name} {chapter.name}
              </Link>
            ) : null}
            <span className="font-medium truncate block">{ride.title}</span>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/rides/${id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        <div className={hasBranding && brand && chapter && brand.domain ? "lg:grid lg:grid-cols-3 lg:gap-8" : ""}>
          {/* Main Content */}
          <div className={hasBranding && brand && chapter && brand.domain ? "lg:col-span-2 space-y-6" : "space-y-6 max-w-3xl"}>
            {/* Back link - Desktop */}
            <Link
              href={hasBranding && brand && chapter ? `/communities/${brand.slug}/${chapter.slug}` : '/discover'}
              className="hidden lg:inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {hasBranding && brand && chapter ? `Back to ${brand.name} ${chapter.name}` : 'Back to rides'}
            </Link>

            {/* Title Section */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                {ride.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <ShareButton
                  rideInfo={rideInfoText}
                  rideUrl={rideUrl}
                  rideTitle={ride.title}
                />
                {canEdit && (
                  <Button variant="outline" size="sm" asChild className="hidden lg:flex">
                    <Link href={`/rides/${id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Live Location Banner - shown when ride is live */}
            {ride.isLive && (
              <LiveLocationBanner
                liveLocationUrl={ride.liveLocationUrl}
                rideName={ride.title}
              />
            )}

            {/* Ride Overview Card - Date, Location, Stats, Description */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Date/Time & Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
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
                  <LocationLink
                    locationName={ride.locationName}
                    locationAddress={ride.locationAddress}
                    latitude={ride.latitude}
                    longitude={ride.longitude}
                  />
                </div>

                {/* Ride Stats - Grid layout matching date/location */}
                {(ride.distance || ride.elevation || speedRange || ride.terrain || ride.maxAttendees) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {ride.distance && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Route className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{ride.distance} km</p>
                            <p className="text-sm text-muted-foreground">Distance</p>
                          </div>
                        </div>
                      )}
                      {ride.elevation && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <span className="text-primary font-bold">↗</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{ride.elevation} m</p>
                            <p className="text-sm text-muted-foreground">Elevation</p>
                          </div>
                        </div>
                      )}
                      {speedRange && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{speedRange}</p>
                            <p className="text-sm text-muted-foreground">Speed</p>
                          </div>
                        </div>
                      )}
                      {ride.terrain && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <span className="text-primary font-bold">◈</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{ride.terrain}</p>
                            <p className="text-sm text-muted-foreground">Terrain</p>
                          </div>
                        </div>
                      )}
                      {ride.maxAttendees && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{ride.maxAttendees}</p>
                            <p className="text-sm text-muted-foreground">Max riders</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Description */}
                {ride.description && (
                  <>
                    <Separator />
                    <div className="text-sm">
                      {ride.description.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Route Embed - show if routeUrl is provided */}
            {ride.routeUrl && <RouteEmbed routeUrl={ride.routeUrl} />}

            {/* Community Route Links */}
            <CommunityRoutes rideId={id} />

            {/* Discussion Section */}
            <SidebarComments rideId={id} isOrganizer={!!canEdit} />

            {/* Ride Details Card - RSVP & Attendees */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Hosted by - inline */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                {/* RSVP & Attendees */}
                <Separator />
                <RsvpSection
                  rideId={id}
                  currentUserRsvpStatus={currentUserRsvpStatus}
                  attendees={attendees}
                  totalGoing={goingRsvps}
                  totalMaybe={maybeRsvps}
                  maxAttendees={ride.maxAttendees}
                  isPastRide={isPastRide}
                />

              </CardContent>
            </Card>

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
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">
                        {labelText}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="sticky top-24 space-y-4">
                {/* Brand Card - links to external brand site (can be hidden) */}
                {!hidePresentedBy && (
                  <Card className="overflow-hidden">
                    <a
                      href={`https://${brand.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      {/* Backdrop image */}
                      {brand.backdrop && (
                        <div
                          className="h-32 bg-cover bg-center"
                          style={{ backgroundImage: `url(${brand.backdrop})` }}
                        />
                      )}
                      {/* Brand info below image */}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="h-12 w-12 object-contain rounded-lg bg-muted p-1.5"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-lg flex items-center justify-center text-lg font-bold text-white"
                              style={{ backgroundColor: brand.primaryColor || '#00D26A' }}
                            >
                              {brand.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Presented by</p>
                            <p className="font-semibold truncate">{brand.name}</p>
                            {brand.slogan && (
                              <p className="text-xs text-muted-foreground italic truncate">{brand.slogan}</p>
                            )}
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </CardContent>
                    </a>
                  </Card>
                )}

                {/* Sponsors Section - chapter-specific sponsors only */}
                {(() => {
                  const chapterSponsors = chapter?.sponsors || [];
                  // Use chapter label if set, otherwise inherit from brand
                  const sponsorLabel = chapter?.sponsorLabel || brand.sponsorLabel || 'sponsors';
                  const labelText = sponsorLabel === 'partners' ? 'Our Partners' : sponsorLabel === 'ads' ? 'Ads' : 'Our Sponsors';

                  if (chapterSponsors.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize px-1">
                        {labelText}
                      </h3>
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
