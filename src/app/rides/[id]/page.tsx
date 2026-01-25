import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CopyRideInfo, RouteEmbed, CommunityRoutes } from '@/components/rides';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Route,
  ChevronLeft,
  ArrowUpRight,
  Edit,
} from 'lucide-react';

interface RidePageProps {
  params: Promise<{ id: string }>;
}

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const PACE_DESCRIPTIONS: Record<string, string> = {
  casual: '< 20 km/h (12 mph)',
  moderate: '20-28 km/h (12-17 mph)',
  fast: '28-35 km/h (17-22 mph)',
  race: '> 35 km/h (22+ mph)',
};

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
            },
          },
        },
      },
      rsvps: {
        where: { status: 'GOING' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: 10,
      },
      _count: {
        select: {
          rsvps: {
            where: { status: 'GOING' },
          },
        },
      },
    },
  });

  if (!ride) {
    notFound();
  }

  const totalAttendees = ride._count.rsvps;
  const pace = ride.pace.toLowerCase();

  // Brand info for branded rides
  const brand = ride.chapter?.brand;
  const chapter = ride.chapter;
  const hasBranding = !!brand;

  // Check if current user can edit this ride
  const canEdit = session?.user?.id && ride.organizer.members.some(
    (member) => member.userId === session?.user?.id
  );

  // Format date and time
  const formattedDate = format(ride.date, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(ride.date, 'h:mm a');
  const formattedEndTime = ride.endTime ? format(ride.endTime, 'h:mm a') : null;

  // Get attendee initials
  const attendees = ride.rsvps.map((rsvp) => {
    const name = rsvp.user.name || rsvp.user.email?.split('@')[0] || 'User';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      id: rsvp.user.id,
      name,
      initials,
    };
  });

  // Build ride info text for copying
  const rideUrl = `https://rideswith-production.up.railway.app/rides/${id}`;
  // Shorten address: take first 2-3 parts (e.g., "Phoenix Park, Dublin" instead of full address)
  const shortAddress = ride.locationAddress.split(',').slice(0, 2).join(',').trim();
  const rideInfoText = [
    `${ride.title}`,
    ``,
    `${formattedDate}`,
    `${formattedStartTime}${formattedEndTime ? ` - ${formattedEndTime}` : ''}`,
    ``,
    `${ride.locationName}`,
    shortAddress,
    ``,
    ride.distance ? `Distance: ${ride.distance} km` : null,
    ride.elevation ? `Elevation: ${ride.elevation} m` : null,
    `Pace: ${pace}`,
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
          {/* Backdrop image - full width, no overlay */}
          {brand.backdrop && (
            <div
              className="h-40 md:h-48 bg-cover bg-center"
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
            <Link href="/discover">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="font-medium truncate flex-1">{ride.title}</span>
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
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Back link - Desktop */}
            <Link
              href={hasBranding && brand && chapter ? `/brands/${brand.slug}/${chapter.slug}` : '/discover'}
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
              {canEdit && (
                <Button variant="outline" size="sm" asChild className="hidden lg:flex">
                  <Link href={`/rides/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>

            {/* Date & Time Card */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{formattedDate}</p>
                    <p className="text-sm text-muted-foreground">
                      {formattedStartTime}
                      {formattedEndTime && ` - ${formattedEndTime}`}
                      {ride.timezone && ` ${ride.timezone}`}
                    </p>
                  </div>
                </div>
                <Separator />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${ride.latitude},${ride.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group hover:bg-muted/50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium group-hover:text-primary transition-colors">{ride.locationName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {ride.locationAddress.split(',').slice(0, 3).join(',')}
                    </p>
                  </div>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    ↗
                  </span>
                </a>
              </CardContent>
            </Card>

            {/* Route Embed - show if routeUrl is provided */}
            {ride.routeUrl && <RouteEmbed routeUrl={ride.routeUrl} />}

            {/* Community Route Links */}
            <CommunityRoutes rideId={id} />

            {/* Mobile Ride Info - hidden on desktop where it shows in sidebar */}
            <Card className="lg:hidden">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Ride Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {ride.distance && (
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.distance} km</span>
                    </div>
                  )}
                  {ride.elevation && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">↗</span>
                      <span>{ride.elevation} m</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formattedStartTime}</span>
                  </div>
                  {ride.maxAttendees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Max {ride.maxAttendees}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pace</span>
                    <Badge variant="secondary" className={PACE_STYLES[pace]}>
                      {pace}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{PACE_DESCRIPTIONS[pace]}</p>
                </div>
                {ride.terrain && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Terrain</span>
                    <p className="text-sm">{ride.terrain}</p>
                  </div>
                )}

                {/* Description */}
                {ride.description && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Details</span>
                      <div className="text-sm">
                        {ride.description.split('\n').map((paragraph, i) => (
                          <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Hosted by */}
                <Separator />
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Hosted by</span>
                  <Link href={`/organizers/${ride.organizer.id}`} className="text-sm font-medium hover:underline flex items-center gap-1">
                    {ride.organizer.name}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* Attendees */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Attendees ({totalAttendees})
                    </span>
                    {totalAttendees > 5 && (
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                        See all
                      </Button>
                    )}
                  </div>
                  {attendees.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {attendees.slice(0, 5).map((attendee) => (
                          <Avatar key={attendee.id} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback className="text-xs">{attendee.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        {totalAttendees > 5 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                            +{totalAttendees - 5}
                          </div>
                        )}
                      </div>
                      {ride.maxAttendees && (
                        <span className="text-xs text-muted-foreground">
                          {ride.maxAttendees - totalAttendees} spots left
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No attendees yet. Be the first!</p>
                  )}
                </div>

                {/* Copy ride info */}
                <Separator />
                <CopyRideInfo rideInfo={rideInfoText} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* Brand Card - shown for branded rides (links to external brand site) */}
              {hasBranding && brand && chapter && brand.domain && (
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

              {/* Ride Stats Card */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Ride Info</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {ride.distance && (
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-muted-foreground" />
                        <span>{ride.distance} km</span>
                      </div>
                    )}
                    {ride.elevation && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">↗</span>
                        <span>{ride.elevation} m</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formattedStartTime}</span>
                    </div>
                    {ride.maxAttendees && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Max {ride.maxAttendees}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pace</span>
                      <Badge variant="secondary" className={PACE_STYLES[pace]}>
                        {pace}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{PACE_DESCRIPTIONS[pace]}</p>
                  </div>
                  {ride.terrain && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Terrain</span>
                      <p className="text-sm">{ride.terrain}</p>
                    </div>
                  )}

                  {/* Description */}
                  {ride.description && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Details</span>
                        <div className="text-sm">
                          {ride.description.split('\n').map((paragraph, i) => (
                            <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Hosted by */}
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Hosted by</span>
                    <Link href={`/organizers/${ride.organizer.id}`} className="text-sm font-medium hover:underline flex items-center gap-1">
                      {ride.organizer.name}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Attendees */}
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Attendees ({totalAttendees})
                      </span>
                      {totalAttendees > 5 && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                          See all
                        </Button>
                      )}
                    </div>
                    {attendees.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {attendees.slice(0, 5).map((attendee) => (
                            <Avatar key={attendee.id} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-xs">{attendee.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                          {totalAttendees > 5 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                              +{totalAttendees - 5}
                            </div>
                          )}
                        </div>
                        {ride.maxAttendees && (
                          <span className="text-xs text-muted-foreground">
                            {ride.maxAttendees - totalAttendees} spots left
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No attendees yet. Be the first!</p>
                    )}
                  </div>

                  {/* Copy ride info */}
                  <Separator />
                  <CopyRideInfo rideInfo={rideInfoText} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
