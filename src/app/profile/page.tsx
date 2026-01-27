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
import { SocialIconsDisplay } from '@/components/profile/social-links-picker';

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
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      slug: true,
      bio: true,
      location: true,
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
        select: {
          id: true,
          ride: {
            select: {
              id: true,
              title: true,
              date: true,
              locationName: true,
              distance: true,
              pace: true,
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
        select: {
          id: true,
          organizer: true,
        },
      },
      chapters: {
        select: {
          id: true,
          role: true,
          chapter: {
            select: {
              id: true,
              slug: true,
              city: true,
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
      brands: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
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
  // Count communities: brands owned + chapters member of (minus overlap for chapters in owned brands)
  const ownedBrandSlugs = user.brands.map(b => b.slug);
  const chapterMemberships = user.chapters.filter(
    m => !ownedBrandSlugs.includes(m.chapter.brand?.slug || '')
  );
  const communityCount = user.brands.length + chapterMemberships.length;

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
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold">{user.name || 'Anonymous Rider'}</h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.slug && (
                      <p className="text-sm text-muted-foreground mt-1">
                        rideswith.com/u/{user.slug}
                      </p>
                    )}
                    {user.bio && (
                      <p className="mt-2 text-sm whitespace-pre-line">{user.bio}</p>
                    )}
                    {user.location && (
                      <p className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {user.location}
                      </p>
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
                      className="mt-2"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile/edit">
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Settings</span>
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
                <p className="text-2xl font-bold">{communityCount}</p>
                <p className="text-sm text-muted-foreground">Communities</p>
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

        {/* My Communities */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              My Communities ({user.brands.length})
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/communities/create">
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {user.brands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No communities yet</p>
                <p className="text-sm mt-1">Create a brand, club, or group to manage chapters and rides.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.brands.map((brand) => (
                  <Link key={brand.id} href={`/communities/${brand.slug}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {brand.logo ? (
                        <div className="h-10 w-10 rounded-lg bg-white p-1.5 flex items-center justify-center">
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {brand.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{brand.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {brand._count.chapters} chapter{brand._count.chapters !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/communities/${brand.slug}/edit`}>
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

        {/* Chapter Memberships */}
        {chapterMemberships.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Chapters ({chapterMemberships.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chapterMemberships.map((membership) => (
                  <Link
                    key={membership.id}
                    href={`/communities/${membership.chapter.brand?.slug}/${membership.chapter.slug}`}
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        {membership.chapter.brand?.logo && (
                          <AvatarImage
                            src={membership.chapter.brand.logoIcon || membership.chapter.brand.logo}
                            style={{ backgroundColor: membership.chapter.brand.primaryColor || undefined }}
                          />
                        )}
                        <AvatarFallback>
                          {membership.chapter.city.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {membership.chapter.brand?.name} {membership.chapter.city}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {membership.chapter._count.rides} rides · {membership.chapter._count.members} members
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
