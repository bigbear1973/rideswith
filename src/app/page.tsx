import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, ArrowRight, Search, Route, Camera } from 'lucide-react';

// Curated Unsplash images for consistent cycling theme
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', // Group of cyclists on road
  ridesNearYou: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80', // Cyclists in nature
  casual: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=400&q=80', // Relaxed cycling
  moderate: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400&q=80', // Road cycling
  fast: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=400&q=80', // Fast cycling
  race: 'https://images.unsplash.com/photo-1517649281203-dad836b4abe5?w=400&q=80', // Racing cyclists
  organizer: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', // Cycling club/group
  ride1: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80', // Morning ride
  ride2: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400&q=80', // Coastal cycling
  ride3: 'https://images.unsplash.com/photo-1605711285791-0219e80e43a3?w=400&q=80', // Urban cycling
};

// Mock data for featured rides
const FEATURED_RIDES = [
  {
    id: '1',
    title: 'Sunday Morning Social',
    organizer: 'Dublin Cycling Club',
    date: 'Sun, Feb 2',
    time: '8:00 AM',
    location: 'Phoenix Park',
    distance: '45 km',
    pace: 'moderate',
    attendees: 23,
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80',
  },
  {
    id: '2',
    title: 'Weekend Warriors',
    organizer: 'Wicklow Wheelers',
    date: 'Sat, Feb 1',
    time: '7:30 AM',
    location: 'Bray Seafront',
    distance: '80 km',
    pace: 'fast',
    attendees: 15,
    image: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400&q=80',
  },
  {
    id: '3',
    title: 'Coffee & Pedals',
    organizer: 'Cafe Cyclists',
    date: 'Sun, Feb 2',
    time: '9:30 AM',
    location: 'Dun Laoghaire Pier',
    distance: '30 km',
    pace: 'casual',
    attendees: 31,
    image: 'https://images.unsplash.com/photo-1605711285791-0219e80e43a3?w=400&q=80',
  },
];

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Mobile-first */}
      <section className="px-4 py-10 sm:py-16 md:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                The{' '}
                <span className="text-primary">cycling</span>{' '}
                platform.
                <br className="hidden sm:block" />
                Where{' '}
                <span className="text-primary">riders</span>{' '}
                become{' '}
                <span className="text-primary">friends</span>.
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg md:mt-6 md:text-xl max-w-2xl mx-auto lg:mx-0">
                Whatever your pace, from casual coffee rides to competitive training,
                there are thousands of cyclists who share it on GroupRide.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" className="w-full sm:w-auto text-base" asChild>
                  <Link href="/discover">
                    <Search className="mr-2 h-5 w-5" />
                    Find Rides
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base" asChild>
                  <Link href="/create">
                    <Route className="mr-2 h-5 w-5" />
                    Create a Ride
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero visual - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 justify-center">
              <div className="relative w-96 h-80">
                <div className="absolute top-4 right-4 w-48 h-48 bg-primary/10 rounded-2xl" />
                <div className="absolute bottom-4 left-4 w-48 h-48 bg-accent/10 rounded-2xl" />
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={IMAGES.hero}
                    alt="Group of cyclists riding together"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rides Near You */}
      <section className="border-t bg-muted/30 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Rides near you</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Discover group rides happening in your area
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link href="/discover">
                See all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible snap-x snap-mandatory sm:snap-none">
            {FEATURED_RIDES.map((ride) => (
              <Link
                key={ride.id}
                href={`/rides/${ride.id}`}
                className="flex-shrink-0 w-[280px] sm:w-auto snap-start"
              >
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                  <div className="aspect-video bg-muted relative">
                    <Image
                      src={ride.image}
                      alt={ride.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{ride.date}</span>
                      <span>·</span>
                      <span>{ride.time}</span>
                    </div>
                    <h3 className="font-semibold line-clamp-2 mb-1">{ride.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{ride.organizer}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{ride.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={PACE_STYLES[ride.pace]}>
                          {ride.pace}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{ride.distance}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{ride.attendees}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-4 sm:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/discover">
                See all rides
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Explore by Pace */}
      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-bold sm:text-2xl mb-6">Explore by pace</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: 'Casual', desc: '< 20 km/h', image: IMAGES.casual, overlay: 'from-green-600/80' },
              { name: 'Moderate', desc: '20-28 km/h', image: IMAGES.moderate, overlay: 'from-blue-600/80' },
              { name: 'Fast', desc: '28-35 km/h', image: IMAGES.fast, overlay: 'from-amber-600/80' },
              { name: 'Race', desc: '> 35 km/h', image: IMAGES.race, overlay: 'from-red-600/80' },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={`/discover?pace=${cat.name.toLowerCase()}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                <Image
                  src={cat.image}
                  alt={`${cat.name} pace cycling`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.overlay} to-transparent`} />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <span className="font-semibold text-sm sm:text-base block">{cat.name}</span>
                  <span className="text-xs opacity-90">{cat.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/30 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-bold sm:text-2xl text-center mb-8">How GroupRide works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { icon: Search, title: 'Discover rides', desc: 'Find local group rides that match your pace and schedule.' },
              { icon: Users, title: 'Join the group', desc: 'RSVP with one click and download routes for any GPS device.' },
              { icon: Camera, title: 'Ride & share', desc: 'Meet at the start, enjoy the ride, and share photos with everyone.' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizer CTA */}
      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 md:p-8">
                <h2 className="text-xl font-bold sm:text-2xl mb-3">Organize group rides?</h2>
                <p className="text-muted-foreground mb-6">
                  Create a club profile, manage all your rides in one place,
                  and grow your community with easy invite links.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link href="/organizers/create">Get started free</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/about/organizers">Learn more</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block flex-1 relative min-h-[200px]">
                <Image
                  src={IMAGES.organizer}
                  alt="Cycling club group"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t bg-muted/30 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '500+', label: 'Active Rides' },
              { value: '2,000+', label: 'Cyclists' },
              { value: '50+', label: 'Cities' },
              { value: '100+', label: 'Clubs' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
