'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MapPin, Calendar, Clock, Users, X, Loader2, Navigation, Filter, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

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

  // Format date for display
  const formatRideDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEE, MMM d');
  };

  const formatRideTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Search Bar - Sticky on mobile, with high z-index to stay above map */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-14 sm:top-16 z-[1000] px-4 py-3">
        <div className="mx-auto max-w-6xl space-y-2">
          {/* Location Search Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search city or location..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-[1100] max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectLocation(result)}
                      className="w-full px-4 py-2 text-left hover:bg-muted text-sm truncate"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Location Button with Location Name */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={useMyLocation}
                title="Use my location"
                className="flex-shrink-0"
              >
                <Navigation className="h-4 w-4" />
              </Button>
              <span className="hidden sm:flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span className="truncate max-w-48">{locationName}</span>
              </span>
            </div>

            {/* Radius Selector */}
            <Select value={searchRadius} onValueChange={setSearchRadius}>
              <SelectTrigger className="w-28 sm:w-32">
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

          {/* Filters Row */}
          <div className="flex gap-2">
            {/* Desktop Filters */}
            <div className="hidden sm:flex gap-2 flex-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={selectedPaces.length > 0 ? "default" : "outline"}
                    size="sm"
                    className="gap-2 font-semibold"
                  >
                    Pace
                    {selectedPaces.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary-foreground text-primary">
                        {selectedPaces.length}
                      </Badge>
                    )}
                  </Button>
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
                  <Button
                    variant={selectedDistances.length > 0 ? "default" : "outline"}
                    size="sm"
                    className="gap-2 font-semibold"
                  >
                    Distance
                    {selectedDistances.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary-foreground text-primary">
                        {selectedDistances.length}
                      </Badge>
                    )}
                  </Button>
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

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className={`w-44 ${dateRange !== 'all' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : ''}`}>
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="font-semibold">
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Current Location Display (Mobile only) */}
            <div className="flex-1 sm:hidden flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{locationName}</span>
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden relative z-[1000]">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] z-[1200]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Pace */}
                  <div>
                    <h3 className="font-medium mb-3">Pace</h3>
                    <div className="flex flex-wrap gap-2">
                      {PACE_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedPaces.includes(option.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePace(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Distance */}
                  <div>
                    <h3 className="font-medium mb-3">Ride Distance</h3>
                    <div className="flex flex-wrap gap-2">
                      {DISTANCE_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedDistances.includes(option.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDistance(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h3 className="font-medium mb-3">Date Range</h3>
                    <div className="flex flex-wrap gap-2">
                      {DATE_RANGE_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={dateRange === option.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDateRange(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-primary">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <h2 className="font-bold text-primary-foreground text-lg">Upcoming Rides</h2>
            <p className="text-sm text-primary-foreground/80">
              {isLoadingRides ? 'Loading...' : `${filteredRides.length} ride${filteredRides.length !== 1 ? 's' : ''} within ${formatRadius(searchRadius)}`}
            </p>
          </div>
        </div>

        {/* Ride List */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
              {isLoadingRides ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin" />
                  <p className="font-medium">Loading rides...</p>
                </div>
              ) : filteredRides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No rides found</p>
                  <p className="text-sm mt-1">Try increasing the search radius or changing location</p>
                  <Link href="/discover/past" className="mt-4 inline-block">
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Browse past rides
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredRides.map((ride) => (
                  <Link key={ride.id} href={`/rides/${ride.id}`}>
                    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatRideDate(ride.date)}</span>
                          <span>·</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatRideTime(ride.date)}</span>
                        </div>
                        <h3 className="font-semibold mb-1">{ride.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{ride.organizer.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{ride.locationName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Brand logo for branded rides */}
                            {ride.brand?.logo && (
                              <div
                                className="h-6 w-6 rounded flex-shrink-0 p-0.5"
                                style={{ backgroundColor: ride.brand.primaryColor || '#f3f4f6' }}
                              >
                                <img
                                  src={ride.brand.logoIcon || ride.brand.logo}
                                  alt={ride.brand.name}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            )}
                            <Badge variant="secondary" className={PACE_STYLES[ride.pace]}>
                              {ride.pace}
                            </Badge>
                            {ride.distance && (
                              <span className="text-xs text-muted-foreground">{formatDistance(ride.distance)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{ride.attendeeCount} going</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}

            {/* Link to past rides archive */}
            {!isLoadingRides && filteredRides.length > 0 && (
              <div className="pt-4 pb-2 border-t mt-4">
                <Link href="/discover/past">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                    <History className="h-4 w-4 mr-2" />
                    Browse past rides archive
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
