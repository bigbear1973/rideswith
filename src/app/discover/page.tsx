'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, MapPin, Calendar, Clock, Users, X } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

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

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// Mock rides data
const MOCK_RIDES = [
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
  },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaces, setSelectedPaces] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<string[]>([]);

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
    setSearchQuery('');
  };

  const activeFilterCount = selectedPaces.length + selectedDistances.length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Search Bar - Sticky on mobile */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-14 sm:top-16 z-40 px-4 py-3">
        <div className="mx-auto max-w-6xl flex gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
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
                <Button variant="outline" className="gap-2">
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
                  <h3 className="font-medium mb-3">Distance</h3>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map Placeholder */}
        <div className="h-48 sm:h-64 lg:h-auto lg:flex-1 bg-muted/50 flex items-center justify-center border-b lg:border-b-0 lg:border-r">
          <div className="text-center p-4">
            <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Map coming soon</p>
          </div>
        </div>

        {/* Ride List */}
        <div className="flex-1 lg:flex-none lg:w-96 xl:w-[420px] flex flex-col">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h2 className="font-semibold">Upcoming Rides</h2>
            <p className="text-sm text-muted-foreground">{MOCK_RIDES.length} rides found</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {MOCK_RIDES.map((ride) => (
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
                          <span className="text-xs text-muted-foreground">{ride.distance}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{ride.attendees} going</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
