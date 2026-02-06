'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, Loader2, Bike, MapPin } from 'lucide-react';
import { useUnits } from '@/components/providers/units-provider';

// Type for latest rides from API
interface LatestRide {
  id: string;
  title: string;
  date: string;
  locationName: string;
  distance: number | null;
  pace: string;
  organizer: {
    id: string;
    name: string;
    slug: string;
  };
  attendeeCount: number;
  brand: {
    name: string;
    logo: string | null;
    backdrop: string | null;
    primaryColor: string | null;
  } | null;
}

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Down arrow icon for CTA
const DownArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

// Ride list item component
function RideListItem({ ride, formatDistance }: { ride: LatestRide; formatDistance: (km: number) => string }) {
  const [isHovered, setIsHovered] = useState(false);
  const rideDate = new Date(ride.date);
  const formattedTime = format(rideDate, 'h:mm a').toUpperCase();

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="list-item-editorial group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Time - hidden on mobile (shown in subtitle) */}
      <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {formattedTime}
      </div>

      {/* Content */}
      <div className="pr-6">
        {/* Mobile: Show time as label */}
        <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {formattedTime}
        </div>
        <div className="text-lg md:text-[22px] font-normal uppercase mb-1">
          {ride.title}
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
          {ride.distance && (
            <span className="after:content-['•'] after:ml-3 after:opacity-40">
              {formatDistance(ride.distance)}
            </span>
          )}
          <span className="after:content-['•'] after:ml-3 after:opacity-40">
            {ride.locationName}
          </span>
          <span>{ride.attendeeCount} Riders</span>
        </div>
      </div>

      {/* Arrow button */}
      <div
        className={`icon-btn-circle transition-all ${
          isHovered ? 'bg-foreground' : ''
        }`}
      >
        <ArrowIcon
          className={`w-4 h-4 transition-all ${
            isHovered ? 'stroke-background' : 'stroke-foreground'
          }`}
        />
      </div>
    </Link>
  );
}

// Stat row component
function StatRow({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-row">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// Filter tab component
function FilterTab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`filter-tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function HomePage({ initialRides = [] }: { initialRides?: LatestRide[] }) {
  const { formatDistance } = useUnits();
  const [latestRides, setLatestRides] = useState<LatestRide[]>(initialRides);
  const [isLoadingRides, setIsLoadingRides] = useState(initialRides.length === 0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: 'All Rides' },
    { id: 'near', label: 'Near Me' },
    { id: 'week', label: 'This Week' },
    { id: 'club', label: 'Club Rides' },
  ];

  // Get user location when "Near Me" is selected
  useEffect(() => {
    if (activeFilter === 'near' && !userLocation) {
      setLocationError(null);
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError('Unable to get your location. Please enable location services.');
          }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser.');
      }
    }
  }, [activeFilter, userLocation]);

  // Fetch rides when filter changes
  useEffect(() => {
    async function fetchLatestRides() {
      setIsLoadingRides(true);
      try {
        // Build URL with filter parameters
        const params = new URLSearchParams({ filter: activeFilter, limit: '6' });

        // Add location for "Near Me" filter
        if (activeFilter === 'near' && userLocation) {
          params.set('lat', userLocation.lat.toString());
          params.set('lng', userLocation.lng.toString());
        }

        // For "Near Me" without location, don't fetch yet
        if (activeFilter === 'near' && !userLocation) {
          setIsLoadingRides(false);
          return;
        }

        const res = await fetch(`/api/rides/latest?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLatestRides(data);
        }
      } catch (error) {
        console.error('Failed to fetch latest rides:', error);
      } finally {
        setIsLoadingRides(false);
      }
    }
    fetchLatestRides();
  }, [activeFilter, userLocation]);

  return (
    <div className="min-h-screen">
      {/* Main Container - Two column layout */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-[120px]">

        {/* Left Column - Ride Discovery */}
        <main>
          <span className="label-editorial block mb-6">Ride Discovery</span>
          <h1 className="heading-display mb-10">
            Find your ride.
            <br />
            Find your people.
          </h1>

          {/* Filters */}
          <div className="flex gap-6 mb-8 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <FilterTab
                key={filter.id}
                active={activeFilter === filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </FilterTab>
            ))}
          </div>

          {/* Telegram Bot Callout */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Prefer searching on your phone? Try our{' '}
              <Link href="/telegram" className="underline hover:text-foreground">
                Telegram bot
              </Link>
              {' '}&mdash; just message @rideswith_bot with queries like &quot;rides near Leipzig&quot;.
            </p>
          </div>

          {/* Ride List */}
          <div className="w-full border-t border-border">
            {/* Loading state */}
            {isLoadingRides && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Location error for Near Me */}
            {activeFilter === 'near' && locationError && (
              <div className="text-center py-16">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-6">{locationError}</p>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="cta-link"
                >
                  <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                  View All Rides
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingRides && latestRides.length === 0 && !locationError && (
              <div className="text-center py-16">
                <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-6">
                  {activeFilter === 'near'
                    ? 'No rides found within 50km of your location.'
                    : activeFilter === 'week'
                    ? 'No rides scheduled for this week.'
                    : activeFilter === 'club'
                    ? 'No club rides available.'
                    : 'No rides yet. Be the first to create one!'}
                </p>
                <Link href="/create" className="cta-link">
                  <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                  Create a Ride
                </Link>
              </div>
            )}

            {/* Rides */}
            {!isLoadingRides && latestRides.length > 0 && (
              <>
                {latestRides.map((ride) => (
                  <RideListItem
                    key={ride.id}
                    ride={ride}
                    formatDistance={formatDistance}
                  />
                ))}
              </>
            )}
          </div>

          {/* View all link */}
          {!isLoadingRides && latestRides.length > 0 && (
            <Link href="/discover" className="cta-link mt-8">
              <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
              View All Rides
            </Link>
          )}
        </main>

        {/* Right Column - Sidebar */}
        <aside className="lg:sticky lg:top-10">
          <span className="label-editorial block mb-6">Our Purpose</span>

          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-[420px]">
            We connect and power a global cycling community that benefits everyone,
            everywhere by making group rides accessible, safe, and social.
          </p>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-[420px]">
            From local coffee spins to competitive gran fondos, our platform helps
            individuals and clubs realize their greatest potential on two wheels.
          </p>

          <Link href="/about" className="cta-link">
            <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
              <DownArrowIcon />
            </div>
            Learn More About Us
          </Link>

          {/* Stats */}
          <div className="mt-16">
            <span className="label-editorial block mb-4">Platform Stats</span>

            <StatRow value="500+" label="Active Rides" />
            <StatRow value="2,000+" label="Cyclists" />
            <StatRow value="10k+" label="Kilometers" />
            <StatRow value="100+" label="Local Clubs" />
          </div>

          {/* CTA for creating */}
          <div className="mt-12">
            <span className="label-editorial block mb-4">Start Organizing</span>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6 max-w-[420px]">
              Have a regular group ride? Create your community and start organizing rides today.
            </p>
            <Link href="/communities/create" className="cta-link">
              <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                <ArrowRight className="w-2.5 h-2.5" />
              </div>
              Create Community
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
