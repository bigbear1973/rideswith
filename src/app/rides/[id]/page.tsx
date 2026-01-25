import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { RideMap } from '@/components/rides';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Route,
  Download,
  Share2,
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
  casual: '< 20 km/h average',
  moderate: '20-28 km/h average',
  fast: '28-35 km/h average',
  race: '> 35 km/h average',
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

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
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
              href="/discover"
              className="hidden lg:inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to rides
            </Link>

            {/* Title Section */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl mb-3">
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
              <p className="text-muted-foreground">
                Hosted by{' '}
                <Link href={`/organizers/${ride.organizer.id}`} className="text-foreground hover:underline">
                  {ride.organizer.name}
                </Link>
              </p>
            </div>

            {/* Organizer Card */}
            <Card>
              <CardContent className="p-4">
                <Link href={`/organizers/${ride.organizer.id}`} className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {ride.organizer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{ride.organizer.name}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{ride.organizer.rideCount} rides</span>
                      <span>{ride.organizer.memberCount} members</span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

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
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{ride.locationName}</p>
                    <p className="text-sm text-muted-foreground">{ride.locationAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <RideMap location={{ lat: ride.latitude, lng: ride.longitude, name: ride.locationName, address: ride.locationAddress }} />

            {/* Details Section */}
            {ride.description && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Details</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {ride.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 text-muted-foreground whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Attendees Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Attendees ({totalAttendees})
                </h2>
                {totalAttendees > 5 && (
                  <Button variant="ghost" size="sm">
                    See all
                  </Button>
                )}
              </div>
              {attendees.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {attendees.slice(0, 5).map((attendee) => (
                      <Avatar key={attendee.id} className="h-10 w-10 border-2 border-background">
                        <AvatarFallback className="text-xs">{attendee.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                    {totalAttendees > 5 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{totalAttendees - 5}
                      </div>
                    )}
                  </div>
                  {ride.maxAttendees && (
                    <span className="text-sm text-muted-foreground">
                      {ride.maxAttendees - totalAttendees} spots left
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendees yet. Be the first to join!</p>
              )}
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* RSVP Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {ride.isFree ? 'Free' : `€${ride.price?.toFixed(2)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {totalAttendees} going
                      {ride.maxAttendees && ` · ${ride.maxAttendees - totalAttendees} spots left`}
                    </p>
                  </div>
                  <Button className="w-full" size="lg">
                    Attend
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    {ride.routeUrl && (
                      <Button variant="outline" className="flex-1" size="sm" asChild>
                        <a href={ride.routeUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Route
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:hidden safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold">
              {ride.isFree ? 'Free' : `€${ride.price?.toFixed(2)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalAttendees} going
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          {ride.routeUrl && (
            <Button variant="outline" size="icon" asChild>
              <a href={ride.routeUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button size="lg">
            Attend
          </Button>
        </div>
      </div>
    </div>
  );
}
