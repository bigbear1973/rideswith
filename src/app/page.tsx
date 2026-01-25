'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsBanner } from '@/components/ui/stats-banner';
import { ColoredSection } from '@/components/ui/colored-section';
import { FeatureCard } from '@/components/ui/feature-card';
import { MapPin, Users, ArrowRight, Search, Route, Camera, Bike, Clock, Heart } from 'lucide-react';
import { useUnits } from '@/components/providers/units-provider';

// Curated Unsplash images for consistent cycling theme
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
  casual: 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=400&q=80',
  moderate: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400&q=80',
  fast: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=400&q=80',
  race: 'https://images.unsplash.com/photo-1517649281203-dad836b4abe5?w=400&q=80',
  organizer: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
};

// Mock data for featured rides - distances in km
const FEATURED_RIDES = [
  {
    id: '1',
    title: 'Sunday Morning Social',
    organizer: 'Dublin Cycling Club',
    date: 'Sun, Feb 2',
    time: '8:00 AM',
    location: 'Phoenix Park',
    distanceKm: 45,
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
    distanceKm: 80,
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
    distanceKm: 30,
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

// Pace descriptions with speed ranges
const PACE_CATEGORIES = [
  { name: 'Casual', speedKmh: { min: 0, max: 20 }, image: IMAGES.casual, desc: 'Relaxed rides for everyone' },
  { name: 'Moderate', speedKmh: { min: 20, max: 28 }, image: IMAGES.moderate, desc: 'Steady fitness building' },
  { name: 'Fast', speedKmh: { min: 28, max: 35 }, image: IMAGES.fast, desc: 'Pushing the limits' },
  { name: 'Race', speedKmh: { min: 35, max: 100 }, image: IMAGES.race, desc: 'Competitive training' },
];

export default function HomePage() {
  const { formatDistance, formatSpeed } = useUnits();

  // Format pace description based on unit system
  const formatPaceDesc = (cat: typeof PACE_CATEGORIES[0]) => {
    if (cat.speedKmh.min === 0) {
      return `< ${formatSpeed(cat.speedKmh.max)}`;
    }
    if (cat.speedKmh.max === 100) {
      return `> ${formatSpeed(cat.speedKmh.min)}`;
    }
    return `${formatSpeed(cat.speedKmh.min).replace(/\s\w+$/, '')}-${formatSpeed(cat.speedKmh.max)}`;
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section - C40 inspired split layout */}
      <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                Find your{' '}
                <span className="text-primary">ride</span>.
                <br />
                Find your{' '}
                <span className="text-primary">people</span>.
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                Whatever your pace, from casual coffee rides to competitive training,
                there are thousands of cyclists who share it on GroupRide.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="c40" size="lg" asChild>
                  <Link href="/discover">
                    FIND RIDES
                  </Link>
                </Button>
                <Button variant="c40Green" size="lg" asChild>
                  <Link href="/create">
                    CREATE A RIDE
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero visual */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
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
      </section>

      {/* Stats Banner - C40 green band */}
      <StatsBanner
        stats={[
          { value: '500+', label: 'Active Rides' },
          { value: '10,000+', label: 'Kilometers Ridden' },
          { value: '2,000+', label: 'Cyclists' },
          { value: '100+', label: 'Clubs' },
        ]}
      />

      {/* Rides Near You */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Rides near you</h2>
              <p className="text-muted-foreground mt-2">
                Discover group rides happening in your area
              </p>
            </div>
            <Button variant="c40" size="lg" asChild className="hidden sm:flex">
              <Link href="/discover">
                SEE ALL
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
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
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
                    <h3 className="font-bold line-clamp-2 mb-1">{ride.title}</h3>
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
                        <span className="text-xs text-muted-foreground">{formatDistance(ride.distanceKm)}</span>
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

          <div className="mt-6 sm:hidden">
            <Button variant="c40" className="w-full" asChild>
              <Link href="/discover">
                SEE ALL RIDES
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Explore by Pace - Cyan section */}
      <ColoredSection color="cyan">
        <h2 className="text-2xl font-bold sm:text-3xl mb-8 text-center">Find your pace</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {PACE_CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/discover?pace=${cat.name.toLowerCase()}`}
              className="group"
            >
              <div className="bg-white rounded-lg p-4 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[4/3] relative rounded-lg overflow-hidden mb-4">
                  <Image
                    src={cat.image}
                    alt={`${cat.name} pace cycling`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="font-bold text-lg text-foreground">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{formatPaceDesc(cat)}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </ColoredSection>

      {/* How It Works */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold sm:text-3xl text-center mb-4">How GroupRide works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of cyclists who use GroupRide to find their community
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={Search}
              title="Discover rides"
              description="Find local group rides that match your pace, schedule, and riding style."
            />
            <FeatureCard
              icon={Users}
              title="Join the group"
              description="RSVP with one click and download routes for any GPS device."
            />
            <FeatureCard
              icon={Bike}
              title="Ride together"
              description="Meet at the start, enjoy the ride, and become part of the community."
            />
          </div>
        </div>
      </section>

      {/* Organizer CTA - Black section */}
      <ColoredSection color="black">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl text-white">
              Organize group rides?
            </h2>
            <p className="text-lg text-white/80">
              Create a club profile, manage all your rides in one place,
              and grow your community with easy invite links.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="c40Dark" size="lg" asChild>
                <Link href="/organizers/create">GET STARTED FREE</Link>
              </Button>
              <Button variant="c40Dark" size="lg" asChild>
                <Link href="/about/organizers">LEARN MORE</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src={IMAGES.organizer}
              alt="Cycling club group"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </ColoredSection>

      {/* Why GroupRide */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold sm:text-3xl text-center mb-12">Why cyclists choose GroupRide</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={MapPin}
              title="Local rides everywhere"
              description="Find group rides in your city, no matter where you are."
            />
            <FeatureCard
              icon={Clock}
              title="Fits your schedule"
              description="Morning, evening, weekend - find rides when you're free."
            />
            <FeatureCard
              icon={Heart}
              title="Build community"
              description="Turn strangers into riding buddies and lifelong friends."
            />
            <FeatureCard
              icon={Route}
              title="GPX downloads"
              description="Get the route on your GPS device before every ride."
            />
            <FeatureCard
              icon={Camera}
              title="Share memories"
              description="Post photos and relive the best moments together."
            />
            <FeatureCard
              icon={Users}
              title="All levels welcome"
              description="From beginners to racers, there's a group for everyone."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <StatsBanner
        stats={[
          { value: '50+', label: 'Cities' },
          { value: '4.9★', label: 'App Rating' },
          { value: '0', label: 'Cost to Join' },
          { value: '∞', label: 'Adventures Ahead' },
        ]}
        className="mb-0"
      />
    </div>
  );
}
