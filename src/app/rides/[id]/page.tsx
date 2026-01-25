import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { RideMap } from '@/components/rides';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Route,
  Download,
  Share2,
  ChevronLeft,
  Star,
  ArrowUpRight,
} from 'lucide-react';

interface RidePageProps {
  params: Promise<{ id: string }>;
}

// Mock ride data - replace with database fetch
const MOCK_RIDE = {
  id: '1',
  title: 'Sunday Morning Social',
  description: `Join us for our weekly Sunday morning social ride! This is a no-drop ride suitable for all fitness levels within the pace category.

We'll meet at Phoenix Park main gate at 7:45 AM for an 8:00 AM rollout. The route takes us through the park, out to Castleknock, and back via the Strawberry Beds.

**What to bring:**
- Helmet (mandatory)
- Water bottles
- Snacks for the coffee stop
- Puncture repair kit

**Route highlights:**
- Scenic views along the Liffey
- Coffee stop at The Strawberry Hall
- Mostly flat with a few gentle climbs`,
  organizer: {
    id: 'org1',
    name: 'Dublin Cycling Club',
    rating: 4.8,
    reviewCount: 156,
    memberCount: 450,
  },
  date: 'Sunday, February 2, 2025',
  time: '8:00 AM',
  endTime: '11:00 AM',
  timezone: 'CET',
  location: {
    name: 'Phoenix Park Main Gate',
    address: 'Chesterfield Ave, Phoenix Park, Dublin 8',
    lat: 53.3559,
    lng: -6.3298,
  },
  distance: '45 km',
  elevation: '320 m',
  pace: 'moderate',
  paceDescription: '20-28 km/h average',
  terrain: 'Mixed (road & cycle path)',
  attendees: [
    { id: '1', name: 'John D.', initials: 'JD' },
    { id: '2', name: 'Sarah M.', initials: 'SM' },
    { id: '3', name: 'Mike R.', initials: 'MR' },
    { id: '4', name: 'Emma K.', initials: 'EK' },
    { id: '5', name: 'David L.', initials: 'DL' },
  ],
  totalAttendees: 23,
  maxAttendees: 30,
  hasRoute: true,
  isFree: true,
};

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default async function RidePage({ params }: RidePageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // TODO: Fetch ride data from database
  const ride = MOCK_RIDE;

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
          <span className="font-medium truncate">{ride.title}</span>
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
              <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl mb-3">
                {ride.title}
              </h1>
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
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {ride.organizer.rating} ({ride.organizer.reviewCount})
                      </span>
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
                    <p className="font-medium">{ride.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {ride.time} - {ride.endTime} {ride.timezone}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{ride.location.name}</p>
                    <p className="text-sm text-muted-foreground">{ride.location.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <RideMap location={ride.location} />

            {/* Details Section */}
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

            {/* Attendees Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Attendees ({ride.totalAttendees})
                </h2>
                <Button variant="ghost" size="sm">
                  See all
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {ride.attendees.slice(0, 5).map((attendee) => (
                    <Avatar key={attendee.id} className="h-10 w-10 border-2 border-background">
                      <AvatarFallback className="text-xs">{attendee.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                  {ride.totalAttendees > 5 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                      +{ride.totalAttendees - 5}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {ride.maxAttendees - ride.totalAttendees} spots left
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* RSVP Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{ride.isFree ? 'Free' : '$XX'}</p>
                    <p className="text-sm text-muted-foreground">
                      {ride.totalAttendees} going · {ride.maxAttendees - ride.totalAttendees} spots left
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
                    {ride.hasRoute && (
                      <Button variant="outline" className="flex-1" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Route
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
                    <div className="flex items-center gap-2">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <span>{ride.distance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">↗</span>
                      <span>{ride.elevation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>~3 hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Max {ride.maxAttendees}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pace</span>
                      <Badge variant="secondary" className={PACE_STYLES[ride.pace]}>
                        {ride.pace}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ride.paceDescription}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Terrain</span>
                    <p className="text-sm">{ride.terrain}</p>
                  </div>
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
            <p className="font-semibold">{ride.isFree ? 'Free' : '$XX'}</p>
            <p className="text-xs text-muted-foreground">
              {ride.totalAttendees} going
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          {ride.hasRoute && (
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
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
