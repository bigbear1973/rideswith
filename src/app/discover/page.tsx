'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, MapPin, Calendar, Clock, Users, X, Loader2, Navigation } from 'lucide-react';
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
import { Map } from '@/components/maps';
import { useUnits } from '@/components/providers/units-provider';

const PACE_OPTIONS = [
  { value: 'casual', label: 'Casual', desc: '< 20 km/h' },
  { value: 'moderate', label: 'Moderate', desc: '20-28 km/h' },
  { value: 'fast', label: 'Fast', desc: '28-35 km/h' },
  { value: 'race', label: 'Race', desc: '> 35 km/h' },
];

const DISTANCE_OPTIONS = [
  { value: 'short', label: 'Short', desc: '< 30 km' },
  { value: 'medium', label: 'Medium', desc: '30-60 km' },
  { value: 'long', label: 'Long', desc: '60-100 km' },
  { value: 'epic', label: 'Epic', desc: '> 100 km' },
];

const RADIUS_OPTIONS = [
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
];

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// Mock rides data with coordinates (distances in km)
const ALL_RIDES = [
  {
    id: '1',
    title: 'Sunday Morning Social',
    organizer: 'Dublin Cycling Club',
    date: 'Sun, Feb 2',
    time: '8:00 AM',
    location: 'Phoenix Park, Dublin',
    lat: 53.3559,
    lng: -6.3298,
    distanceKm: 45,
    pace: 'moderate',
    attendees: 23,
  },
  {
    id: '2',
    title: 'Weekend Warriors',
    organizer: 'Wicklow Wheelers',
    date: 'Sat, Feb 1',
    time: '7:30 AM',
    location: 'Bray Seafront',
    lat: 53.2008,
    lng: -6.0987,
    distanceKm: 80,
    pace: 'fast',
    attendees: 15,
  },
  {
    id: '3',
    title: 'Coffee & Pedals',
    organizer: 'Cafe Cyclists',
    date: 'Sun, Feb 2',
    time: '9:30 AM',
    location: 'Dun Laoghaire Pier',
    lat: 53.2945,
    lng: -6.1356,
    distanceKm: 30,
    pace: 'casual',
    attendees: 31,
  },
  {
    id: '4',
    title: 'Cork City Loop',
    organizer: 'Cork Cycling Club',
    date: 'Sat, Feb 8',
    time: '9:00 AM',
    location: 'Fitzgerald Park, Cork',
    lat: 51.8969,
    lng: -8.4863,
    distanceKm: 55,
    pace: 'moderate',
    attendees: 18,
  },
  {
    id: '5',
    title: 'Galway Bay Spin',
    organizer: 'Galway Tri Club',
    date: 'Sun, Feb 9',
    time: '8:30 AM',
    location: 'Salthill Promenade',
    lat: 53.2590,
    lng: -9.0817,
    distanceKm: 60,
    pace: 'fast',
    attendees: 12,
  },
];

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
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 53.3498, lng: -6.2603 }); // Dublin default
  const [searchRadius, setSearchRadius] = useState('50');
  const [selectedPaces, setSelectedPaces] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);
  const [locationName, setLocationName] = useState('Dublin, Ireland');
  const { formatDistance, unitSystem } = useUnits();

  // Filter rides based on location and radius
  const filteredRides = ALL_RIDES.filter((ride) => {
    const distanceFromCenter = getDistanceKm(
      mapCenter.lat,
      mapCenter.lng,
      ride.lat,
      ride.lng
    );
    const withinRadius = distanceFromCenter <= parseInt(searchRadius);
    const matchesPace = selectedPaces.length === 0 || selectedPaces.includes(ride.pace);
    return withinRadius && matchesPace;
  });

  const mapMarkers = filteredRides.map((ride) => ({
    id: ride.id,
    position: { lat: ride.lat, lng: ride.lng },
    title: ride.title,
  }));

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
            'User-Agent': 'GroupRide/1.0',
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
  };

  const activeFilterCount = selectedPaces.length + selectedDistances.length;

  // Format radius display based on unit system
  const formatRadius = (km: string) => {
    if (unitSystem === 'imperial') {
      const miles = Math.round(parseInt(km) * 0.621371);
      return `${miles} mi`;
    }
    return `${km} km`;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Search Bar - Sticky on mobile */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-14 sm:top-16 z-40 px-4 py-3">
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
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

            <Button
              variant="outline"
              size="icon"
              onClick={useMyLocation}
              title="Use my location"
            >
              <Navigation className="h-4 w-4" />
            </Button>

            {/* Radius Selector */}
            <Select value={searchRadius} onValueChange={setSearchRadius}>
              <SelectTrigger className="w-28 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
                  <Button variant="outline" size="sm" className="gap-2">
                    Pace
                    {selectedPaces.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {selectedPaces.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
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
                  <Button variant="outline" size="sm" className="gap-2">
                    Distance
                    {selectedDistances.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {selectedDistances.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
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

              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Current Location Display */}
            <div className="flex-1 sm:flex-none flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{locationName}</span>
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="sm:hidden relative">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh]">
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
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map */}
        <div className="h-48 sm:h-64 lg:h-auto lg:flex-1 border-b lg:border-b-0 lg:border-r">
          <Map
            center={mapCenter}
            zoom={10}
            markers={mapMarkers}
            className="h-full w-full"
          />
        </div>

        {/* Ride List */}
        <div className="flex-1 lg:flex-none lg:w-96 xl:w-[420px] flex flex-col">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold">Upcoming Rides</h2>
            <p className="text-sm text-muted-foreground">
              {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''} within {formatRadius(searchRadius)}
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {filteredRides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No rides found</p>
                  <p className="text-sm mt-1">Try increasing the search radius or changing location</p>
                </div>
              ) : (
                filteredRides.map((ride) => (
                  <Link key={ride.id} href={`/rides/${ride.id}`}>
                    <Card className="overflow-hidden transition-shadow hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{ride.date}</span>
                          <span>·</span>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{ride.time}</span>
                        </div>
                        <h3 className="font-semibold mb-1">{ride.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{ride.organizer}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
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
                            <span>{ride.attendees} going</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
