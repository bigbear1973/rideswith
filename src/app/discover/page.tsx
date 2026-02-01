'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Calendar, X, Loader2, Navigation, Filter, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnits } from '@/components/providers/units-provider';

const PACE_OPTIONS = [
  { value: 'casual', label: 'Casual', desc: '< 20 km/h' },
  { value: 'moderate', label: 'Moderate', desc: '20-28 km/h' },
  { value: 'fast', label: 'Fast', desc: '28-35 km/h' },
  { value: 'race', label: 'Race', desc: '> 35 km/h' },
];

const DISTANCE_OPTIONS = [
  { value: 'short', label: 'Short', desc: '< 30 km', min: 0, max: 30 },
  { value: 'medium', label: 'Medium', desc: '30-60 km', min: 30, max: 60 },
  { value: 'long', label: 'Long', desc: '60-100 km', min: 60, max: 100 },
  { value: 'epic', label: 'Epic', desc: '> 100 km', min: 100, max: Infinity },
];

const RADIUS_OPTIONS = [
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All upcoming', days: null },
  { value: '7', label: 'Next 7 days', days: 7 },
  { value: '14', label: 'Next 2 weeks', days: 14 },
  { value: '30', label: 'Next month', days: 30 },
  { value: '90', label: 'Next 3 months', days: 90 },
];

interface Ride {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endTime: string | null;
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  elevation: number | null;
  pace: string;
  terrain: string | null;
  maxAttendees: number | null;
  isFree: boolean;
  price: number | null;
  routeUrl: string | null;
  organizer: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    name: string;
    slug: string;
    logo: string | null;
    logoIcon: string | null;
    primaryColor: string | null;
  } | null;
  attendeeCount: number;
}

// Haversine formula to calculate distance between two points
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Ride list item component
function RideListItem({ ride, formatDistance }: { ride: Ride; formatDistance: (km: number) => string }) {
  const [isHovered, setIsHovered] = useState(false);
  const rideDate = new Date(ride.date);
  const formattedDate = format(rideDate, 'EEE, MMM d').toUpperCase();
  const formattedTime = format(rideDate, 'h:mm a').toUpperCase();

  return (
    <Link
      href={`/rides/${ride.id}`}
      className="list-item-editorial group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Date/Time - hidden on mobile */}
      <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div>{formattedDate}</div>
        <div className="mt-1 text-foreground">{formattedTime}</div>
      </div>

      {/* Content */}
      <div className="pr-6">
        {/* Mobile: Show date/time as label */}
        <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          {formattedDate} • {formattedTime}
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
        {/* Organizer */}
        <div className="text-xs text-muted-foreground mt-2">
          Hosted by {ride.organizer.name}
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

export default function DiscoverPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState(true);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 53.3498, lng: -6.2603 }); // Dublin default
  const [searchRadius, setSearchRadius] = useState('50');
  const [selectedPaces, setSelectedPaces] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [locationName, setLocationName] = useState('Dublin, Ireland');
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const { formatDistance, unitSystem } = useUnits();

  // Request user location on first load
  useEffect(() => {
    if (hasRequestedLocation) return;
    setHasRequestedLocation(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationName('Your location');
        },
        (error) => {
          // User denied or error - keep default location (Dublin)
          console.log('Geolocation not available or denied:', error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    }
  }, [hasRequestedLocation]);

  // Fetch rides from database
  useEffect(() => {
    async function fetchRides() {
      setIsLoadingRides(true);
      try {
        const response = await fetch('/api/rides');
        if (response.ok) {
          const data = await response.json();
          setRides(data);
        }
      } catch (error) {
        console.error('Failed to fetch rides:', error);
      } finally {
        setIsLoadingRides(false);
      }
    }
    fetchRides();
  }, []);

  // Filter rides based on location, radius, pace, distance, and date range
  const filteredRides = rides.filter((ride) => {
    // Check distance from center (search radius)
    const distanceFromCenter = getDistanceKm(
      mapCenter.lat,
      mapCenter.lng,
      ride.latitude,
      ride.longitude
    );
    const withinRadius = distanceFromCenter <= parseInt(searchRadius);

    // Check pace filter
    const matchesPace = selectedPaces.length === 0 || selectedPaces.includes(ride.pace);

    // Check ride distance filter
    let matchesDistance = true;
    if (selectedDistances.length > 0 && ride.distance !== null) {
      matchesDistance = selectedDistances.some((distanceKey) => {
        const option = DISTANCE_OPTIONS.find((opt) => opt.value === distanceKey);
        if (!option) return false;
        return ride.distance !== null && ride.distance >= option.min && ride.distance < option.max;
      });
    } else if (selectedDistances.length > 0 && ride.distance === null) {
      // If distance filter is set but ride has no distance, exclude it
      matchesDistance = false;
    }

    // Check date range filter
    let matchesDateRange = true;
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const rideDate = new Date(ride.date);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      matchesDateRange = rideDate <= cutoffDate;
    }

    return withinRadius && matchesPace && matchesDistance && matchesDateRange;
  });

  // Debounced search for locations using Nominatim (OpenStreetMap)
  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'RidesWith/1.0',
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Location search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationQuery) {
        searchLocation(locationQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationQuery, searchLocation]);

  const selectLocation = (result: SearchResult) => {
    setMapCenter({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setLocationName(result.display_name.split(',').slice(0, 2).join(','));
    setLocationQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const useMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationName('Your location');
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const togglePace = (pace: string) => {
    setSelectedPaces((prev) =>
      prev.includes(pace) ? prev.filter((p) => p !== pace) : [...prev, pace]
    );
  };

  const toggleDistance = (distance: string) => {
    setSelectedDistances((prev) =>
      prev.includes(distance) ? prev.filter((d) => d !== distance) : [...prev, distance]
    );
  };

  const clearFilters = () => {
    setSelectedPaces([]);
    setSelectedDistances([]);
    setDateRange('all');
  };

  const activeFilterCount = selectedPaces.length + selectedDistances.length + (dateRange !== 'all' ? 1 : 0);

  // Format radius display based on unit system
  const formatRadius = (km: string) => {
    if (unitSystem === 'imperial') {
      const miles = Math.round(parseInt(km) * 0.621371);
      return `${miles} mi`;
    }
    return `${km} km`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px]">
        {/* Header */}
        <span className="label-editorial block mb-6">Ride Discovery</span>
        <h1 className="heading-display mb-10">
          Find rides<br />near you.
        </h1>

        {/* Location Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-8 border-b border-border">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search city or location..."
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              className="pl-9 border-foreground/20 focus:border-foreground"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-[1100] max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectLocation(result)}
                    className="w-full px-4 py-3 text-left hover:bg-muted text-sm truncate border-b border-border last:border-b-0"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={useMyLocation}
              title="Use my location"
              className="flex-shrink-0 border-foreground/20 hover:bg-foreground hover:text-background"
            >
              <Navigation className="h-4 w-4" />
            </Button>

            <Select value={searchRadius} onValueChange={setSearchRadius}>
              <SelectTrigger className="w-28 border-foreground/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1100]">
                {RADIUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {formatRadius(option.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location display */}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{locationName}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mb-8 items-center">
          {/* Desktop Filters */}
          <div className="hidden sm:flex gap-6 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`filter-tab ${selectedPaces.length > 0 ? 'active' : ''}`}>
                  Pace {selectedPaces.length > 0 && `(${selectedPaces.length})`}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 z-[1100]">
                {PACE_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedPaces.includes(option.value)}
                    onCheckedChange={() => togglePace(option.value)}
                  >
                    <span className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`filter-tab ${selectedDistances.length > 0 ? 'active' : ''}`}>
                  Distance {selectedDistances.length > 0 && `(${selectedDistances.length})`}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 z-[1100]">
                {DISTANCE_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={selectedDistances.includes(option.value)}
                    onCheckedChange={() => toggleDistance(option.value)}
                  >
                    <span className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`filter-tab ${dateRange !== 'all' ? 'active' : ''}`}>
                  <Calendar className="h-3.5 w-3.5 mr-1.5 inline" />
                  {DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label || 'Date'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 z-[1100]">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={dateRange === option.value}
                    onCheckedChange={() => setDateRange(option.value)}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="filter-tab text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1 inline" />
                Clear
              </button>
            )}
          </div>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="sm:hidden border-foreground/20">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 h-5 w-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] z-[1200]">
              <SheetHeader>
                <SheetTitle className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Filters
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Pace */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Pace</h3>
                  <div className="flex flex-wrap gap-2">
                    {PACE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={selectedPaces.includes(option.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => togglePace(option.value)}
                        className="uppercase text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Ride Distance</h3>
                  <div className="flex flex-wrap gap-2">
                    {DISTANCE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={selectedDistances.includes(option.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleDistance(option.value)}
                        className="uppercase text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3">Date Range</h3>
                  <div className="flex flex-wrap gap-2">
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={dateRange === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDateRange(option.value)}
                        className="uppercase text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <Button variant="outline" className="w-full uppercase text-xs" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Ride count */}
          <div className="ml-auto text-sm text-muted-foreground">
            {isLoadingRides ? 'Loading...' : `${filteredRides.length} ride${filteredRides.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Ride List */}
        <div className="w-full border-t border-border">
          {isLoadingRides ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No rides found</p>
              <p className="text-sm text-muted-foreground mb-6">Try increasing the search radius or changing location</p>
              <Link href="/discover/past" className="cta-link">
                <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                  <History className="w-2.5 h-2.5" />
                </div>
                Browse Past Rides
              </Link>
            </div>
          ) : (
            <>
              {filteredRides.map((ride) => (
                <RideListItem
                  key={ride.id}
                  ride={ride}
                  formatDistance={formatDistance}
                />
              ))}
            </>
          )}
        </div>

        {/* Link to past rides archive */}
        {!isLoadingRides && filteredRides.length > 0 && (
          <Link href="/discover/past" className="cta-link mt-8">
            <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
              <History className="w-2.5 h-2.5" />
            </div>
            Browse Past Rides
          </Link>
        )}

        {/* Telegram Bot Callout */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Prefer searching on your phone? Try our{' '}
            <Link href="/telegram" className="underline hover:text-foreground">
              Telegram bot
            </Link>
            {' '}&mdash; just message @rideswith_bot with queries like &quot;rides near Berlin&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}
