'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Trash2,
} from 'lucide-react';
import { useUnits } from '@/components/providers/units-provider';

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface EditRidePageProps {
  params: Promise<{ id: string }>;
}


const TERRAIN_OPTIONS = [
  'Road',
  'Gravel',
  'Mixed (Road & Gravel)',
  'Mixed (Road & Cycle Path)',
  'Mountain Bike',
  'Cycle Path Only',
];

export default function EditRidePage({ params }: EditRidePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { unitSystem } = useUnits();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [paceMin, setPaceMin] = useState('');
  const [paceMax, setPaceMax] = useState('');
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/rides/${id}/edit`);
    }
  }, [status, router, id]);

  // Load ride data
  useEffect(() => {
    async function loadRide() {
      try {
        const response = await fetch(`/api/rides/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setLoadError('Ride not found');
          } else {
            setLoadError('Failed to load ride');
          }
          return;
        }

        const ride = await response.json();

        // Populate form with ride data
        setTitle(ride.title);
        setDescription(ride.description || '');

        const rideDate = new Date(ride.date);
        setDate(format(rideDate, 'yyyy-MM-dd'));
        setStartTime(format(rideDate, 'HH:mm'));

        if (ride.endTime) {
          const endDate = new Date(ride.endTime);
          setEndTime(format(endDate, 'HH:mm'));
        }

        setLocationName(ride.locationName);
        setLocationAddress(ride.locationAddress);
        setLatitude(ride.latitude);
        setLongitude(ride.longitude);
        setDistance(ride.distance?.toString() || '');
        setElevation(ride.elevation?.toString() || '');
        setPaceMin(ride.paceMin?.toString() || '');
        setPaceMax(ride.paceMax?.toString() || '');
        setTerrain(ride.terrain || '');
        setMaxAttendees(ride.maxAttendees?.toString() || '');
        setRouteUrl(ride.routeUrl || '');
        setIsFree(ride.isFree);
        setPrice(ride.price?.toString() || '');
      } catch (err) {
        setLoadError('Failed to load ride');
      } finally {
        setIsLoading(false);
      }
    }

    if (id && status === 'authenticated') {
      loadRide();
    }
  }, [id, status]);

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
    if (!date) {
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
      const dateTime = new Date(`${date}T${startTime}`);
      const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null;

      const response = await fetch(`/api/rides/${id}`, {
        method: 'PUT',
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
          paceMin: paceMin ? parseFloat(paceMin) : null,
          paceMax: paceMax ? parseFloat(paceMax) : null,
          terrain: terrain || null,
          maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
          routeUrl: routeUrl.trim() || null,
          isFree,
          price: !isFree && price ? parseFloat(price) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update ride');
      }

      router.push(`/rides/${id}`);
    } catch (err) {
      console.error('Update ride error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rides/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete ride');
      }

      router.push('/discover');
    } catch (err) {
      console.error('Delete ride error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete ride');
      setIsDeleting(false);
    }
  };

  // Show loading while checking auth or loading ride
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render form if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Show error if ride couldn't be loaded
  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{loadError}</p>
        <Button asChild>
          <Link href="/discover">Back to Discover</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/rides/${id}`}>
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-lg font-semibold">Edit Ride</h1>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this ride?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All RSVPs and ride data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Ride'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                  placeholder="Tell riders what to expect..."
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
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (estimated)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                    placeholder="Search for a new location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

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
                <Label>Speed Range ({unitSystem === 'metric' ? 'km/h' : 'mph'})</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-paceMin" className="text-xs text-muted-foreground">Min Speed</Label>
                    <Input
                      id="edit-paceMin"
                      type="number"
                      placeholder="e.g., 25"
                      value={paceMin}
                      onChange={(e) => setPaceMin(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-paceMax" className="text-xs text-muted-foreground">Max Speed</Label>
                    <Input
                      id="edit-paceMax"
                      type="number"
                      placeholder="e.g., 30"
                      value={paceMax}
                      onChange={(e) => setPaceMax(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Specify the expected speed range for this ride
                </p>
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
                    htmlFor="edit-free"
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${
                      isFree ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="free" id="edit-free" />
                    <span>Free</span>
                  </Label>
                  <Label
                    htmlFor="edit-paid"
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${
                      !isFree ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="paid" id="edit-paid" />
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
              onClick={() => router.push(`/rides/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
