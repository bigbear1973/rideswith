'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Calendar,
  Route,
  Users,
  Loader2,
  Search,
  ChevronLeft,
  Link as LinkIcon,
  Euro,
} from 'lucide-react';
import { useUnits } from '@/components/providers/units-provider';
import { DatePicker, TimePicker } from '@/components/ui/date-time-picker';

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const PACE_OPTIONS = [
  { value: 'CASUAL', label: 'Casual', desc: '< 20 km/h' },
  { value: 'MODERATE', label: 'Moderate', desc: '20-28 km/h' },
  { value: 'FAST', label: 'Fast', desc: '28-35 km/h' },
  { value: 'RACE', label: 'Race', desc: '> 35 km/h' },
];

const TERRAIN_OPTIONS = [
  'Road',
  'Gravel',
  'Mixed (Road & Gravel)',
  'Mixed (Road & Cycle Path)',
  'Mountain Bike',
  'Cycle Path Only',
];

interface ChapterInfo {
  id: string;
  name: string;
  slug: string;
  city: string;
  brand: {
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
  };
}

export default function CreateRidePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { unitSystem } = useUnits();

  // Chapter context (if creating ride for a chapter)
  const chapterId = searchParams.get('chapterId');
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(!!chapterId);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rideDate, setRideDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [pace, setPace] = useState('MODERATE');
  const [terrain, setTerrain] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [routeUrl, setRouteUrl] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');

  // Location search state
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLocationResults, setShowLocationResults] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = chapterId ? `/create?chapterId=${chapterId}` : '/create';
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router, chapterId]);

  // Load chapter info if chapterId is provided
  useEffect(() => {
    if (!chapterId) {
      setLoadingChapter(false);
      return;
    }

    async function loadChapter() {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`);
        if (res.ok) {
          const data = await res.json();
          setChapterInfo(data);
        }
      } catch (err) {
        console.error('Failed to load chapter:', err);
      } finally {
        setLoadingChapter(false);
      }
    }

    loadChapter();
  }, [chapterId]);

  // Location search with Nominatim
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationResults([]);
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
      setLocationResults(data);
      setShowLocationResults(true);
    } catch (err) {
      console.error('Location search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationSearch) {
        searchLocation(locationSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  const selectLocation = (result: LocationResult) => {
    // Extract a shorter name from the full display name
    const parts = result.display_name.split(',');
    const shortName = parts.slice(0, 2).join(',').trim();

    setLocationName(shortName);
    setLocationAddress(result.display_name);
    setLatitude(parseFloat(result.lat));
    setLongitude(parseFloat(result.lon));
    setLocationSearch('');
    setShowLocationResults(false);
    setLocationResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Please enter a ride title');
      return;
    }
    if (!rideDate) {
      setError('Please select a date');
      return;
    }
    if (!startTime) {
      setError('Please select a start time');
      return;
    }
    if (!latitude || !longitude) {
      setError('Please select a meeting location');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into ISO string
      const [hours, minutes] = startTime.split(':').map(Number);
      const dateTime = new Date(rideDate);
      dateTime.setHours(hours, minutes, 0, 0);

      let endDateTime: Date | null = null;
      if (endTime) {
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        endDateTime = new Date(rideDate);
        endDateTime.setHours(endHours, endMinutes, 0, 0);
      }

      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          date: dateTime.toISOString(),
          endTime: endDateTime?.toISOString() || null,
          locationName,
          locationAddress,
          latitude,
          longitude,
          distance: distance ? parseFloat(distance) : null,
          elevation: elevation ? parseFloat(elevation) : null,
          pace,
          terrain: terrain || null,
          maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
          routeUrl: routeUrl.trim() || null,
          isFree,
          price: !isFree && price ? parseFloat(price) : null,
          chapterId: chapterId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create ride');
      }

      const ride = await response.json();
      router.push(`/rides/${ride.id}`);
    } catch (err) {
      console.error('Create ride error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth or loading chapter
  if (status === 'loading' || loadingChapter) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render form if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Determine back link based on context
  const backLink = chapterInfo
    ? `/brands/${chapterInfo.brand.slug}/${chapterInfo.slug}`
    : '/discover';

  return (
    <div className="min-h-screen pb-8">
      {/* Chapter Banner - shown when creating for a chapter */}
      {chapterInfo && (
        <div
          className="py-4 text-white"
          style={{ backgroundColor: chapterInfo.brand.primaryColor || '#00D26A' }}
        >
          <div className="container mx-auto px-4">
            <Link
              href={backLink}
              className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              {chapterInfo.brand.logo ? (
                <img
                  src={chapterInfo.brand.logo}
                  alt={chapterInfo.brand.name}
                  className="h-10 w-10 object-contain rounded-lg bg-white p-1"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                  {chapterInfo.brand.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold">{chapterInfo.brand.name} {chapterInfo.name}</p>
                <p className="text-white/80 text-sm">{chapterInfo.city}</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={backLink}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">
              {chapterInfo ? `Create Ride for ${chapterInfo.brand.name} ${chapterInfo.name}` : 'Create a Ride'}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Ride Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Sunday Morning Social"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Tell riders what to expect - route highlights, what to bring, coffee stops, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <DatePicker
                  date={rideDate}
                  setDate={setRideDate}
                  placeholder="Select ride date"
                  minDate={new Date()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <TimePicker
                    time={startTime}
                    setTime={setStartTime}
                    placeholder="Select time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time (estimated)</Label>
                  <TimePicker
                    time={endTime}
                    setTime={setEndTime}
                    placeholder="Select time"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Meeting Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="locationSearch">Search Location *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="locationSearch"
                    placeholder="Search for a location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Location search results */}
                {showLocationResults && locationResults.length > 0 && (
                  <div className="border rounded-md bg-background shadow-lg max-h-60 overflow-y-auto">
                    {locationResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => selectLocation(result)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b last:border-b-0"
                      >
                        <p className="font-medium truncate">
                          {result.display_name.split(',')[0]}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">
                          {result.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected location display */}
              {latitude && longitude && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{locationName}</p>
                  <p className="text-sm text-muted-foreground">{locationAddress}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ride Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Route className="h-5 w-5" />
                Ride Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">
                    Distance ({unitSystem === 'metric' ? 'km' : 'mi'})
                  </Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="e.g., 45"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elevation">
                    Elevation ({unitSystem === 'metric' ? 'm' : 'ft'})
                  </Label>
                  <Input
                    id="elevation"
                    type="number"
                    placeholder="e.g., 320"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pace *</Label>
                <RadioGroup
                  value={pace}
                  onValueChange={setPace}
                  className="grid grid-cols-2 gap-3"
                >
                  {PACE_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        pace === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terrain">Terrain</Label>
                <Select value={terrain} onValueChange={setTerrain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select terrain type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERRAIN_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routeUrl">Route Link or Embed Code</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="routeUrl"
                    type="text"
                    placeholder="URL or paste embed code from Komoot, RideWithGPS..."
                    value={routeUrl}
                    onChange={(e) => setRouteUrl(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a route URL or full iframe embed code from Komoot, RideWithGPS, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  placeholder="Leave blank for unlimited"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  min="1"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Pricing</Label>
                <RadioGroup
                  value={isFree ? 'free' : 'paid'}
                  onValueChange={(v) => setIsFree(v === 'free')}
                  className="flex gap-4"
                >
                  <Label
                    htmlFor="free"
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${
                      isFree ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="free" id="free" />
                    <span>Free</span>
                  </Label>
                  <Label
                    htmlFor="paid"
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${
                      !isFree ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="paid" id="paid" />
                    <span>Paid</span>
                  </Label>
                </RadioGroup>

                {!isFree && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (EUR)</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ride'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
