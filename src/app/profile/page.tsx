import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Settings,
  Edit,
  Users,
  Route,
  History,
  Building2,
  Plus,
} from 'lucide-react';

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
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
      brands: {
        include: {
          _count: {
            select: { chapters: true },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  const now = new Date();
  const upcomingRides = user.rsvps
    .filter((rsvp) => new Date(rsvp.ride.date) >= now)
    .sort((a, b) => new Date(a.ride.date).getTime() - new Date(b.ride.date).getTime());
  const pastRides = user.rsvps
    .filter((rsvp) => new Date(rsvp.ride.date) < now)
    .slice(0, 10); // Show last 10 past rides

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.slice(0, 2).toUpperCase() || 'U';

  // Calculate stats
  const totalRides = user.rsvps.length;
  const totalDistance = pastRides.reduce((sum, rsvp) => sum + (rsvp.ride.distance || 0), 0);
  const organizerCount = user.organizers.length;

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24">
                {user.image && <AvatarImage src={user.image} alt={user.name || ''} />}
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{user.name || 'Anonymous Rider'}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.slug && (
                      <p className="text-sm text-muted-foreground mt-1">
                        rideswith.com/u/{user.slug}
                      </p>
                    )}
                    {user.bio && (
                      <p className="mt-2 text-sm">{user.bio}</p>
                    )}
                    {user.location && (
                      <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {user.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile/edit">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{totalRides}</p>
                <p className="text-sm text-muted-foreground">Rides Joined</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalDistance)}</p>
                <p className="text-sm text-muted-foreground">km Ridden</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{organizerCount}</p>
                <p className="text-sm text-muted-foreground">Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Rides */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Rides ({upcomingRides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No upcoming rides</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/discover">Discover rides near you</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingRides.map((rsvp) => (
                  <Link key={rsvp.id} href={`/rides/${rsvp.ride.id}`}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center min-w-[60px] bg-primary/10 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(rsvp.ride.date), 'MMM')}
                        </span>
                        <span className="text-2xl font-bold">
                          {format(new Date(rsvp.ride.date), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{rsvp.ride.title}</h3>
                        <p className="text-sm text-muted-foreground">{rsvp.ride.organizer.name}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(rsvp.ride.date), 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {rsvp.ride.locationName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={PACE_STYLES[rsvp.ride.pace.toLowerCase()]}>
                            {rsvp.ride.pace.toLowerCase()}
                          </Badge>
                          {rsvp.ride.distance && (
                            <span className="text-xs text-muted-foreground">
                              {rsvp.ride.distance} km
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Users className="h-3.5 w-3.5" />
                            {rsvp.ride._count.rsvps} going
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Ride History ({pastRides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastRides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No ride history yet</p>
                <p className="text-sm mt-1">Join your first ride to start tracking!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastRides.map((rsvp) => (
                  <Link key={rsvp.id} href={`/rides/${rsvp.ride.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="text-sm text-muted-foreground min-w-[80px]">
                        {format(new Date(rsvp.ride.date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{rsvp.ride.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {rsvp.ride.organizer.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rsvp.ride.distance && (
                          <span className="text-sm text-muted-foreground">
                            {rsvp.ride.distance} km
                          </span>
                        )}
                        <Badge variant="secondary" className={PACE_STYLES[rsvp.ride.pace.toLowerCase()]}>
                          {rsvp.ride.pace.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Brands */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              My Brands ({user.brands.length})
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/brands/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Brand
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {user.brands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No brands yet</p>
                <p className="text-sm mt-1">Create a brand to manage chapters and rides.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.brands.map((brand) => (
                  <Link key={brand.id} href={`/brands/${brand.slug}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        {brand.logo && (
                          <AvatarImage src={brand.logo} alt={brand.name} />
                        )}
                        <AvatarFallback>
                          {brand.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{brand.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {brand._count.chapters} chapter{brand._count.chapters !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/brands/${brand.slug}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organizer Memberships */}
        {user.organizers.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Groups ({user.organizers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.organizers.map((membership) => (
                  <Link key={membership.id} href={`/organizers/${membership.organizer.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        {membership.organizer.logoUrl && (
                          <AvatarImage src={membership.organizer.logoUrl} />
                        )}
                        <AvatarFallback>
                          {membership.organizer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{membership.organizer.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {membership.organizer.rideCount} rides · {membership.organizer.memberCount} members
                        </p>
                      </div>
                      <Badge variant="outline">{membership.role.toLowerCase()}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
