"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ArrowLeftIcon,
  SearchIcon,
  ClockIcon,
} from "lucide-react";
import { format, subDays, subMonths, isAfter, isBefore, parseISO } from "date-fns";
import { useUnits } from "@/components/providers/units-provider";

interface Ride {
  id: string;
  title: string;
  date: string;
  location: string;
  locationName?: string;
  distance: number | null;
  pace: string;
  latitude: number | null;
  longitude: number | null;
  organizer: {
    id: string;
    name: string;
  };
  brand: {
    name: string;
    slug: string;
    logo: string | null;
    logoIcon: string | null;
    primaryColor: string | null;
  } | null;
  _count?: {
    rsvps: number;
  };
}

const PACE_OPTIONS = [
  { value: "all", label: "All Paces" },
  { value: "casual", label: "Casual" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast" },
  { value: "race", label: "Race" },
];

const TIME_RANGE_OPTIONS = [
  { value: "14days", label: "Last 14 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "3months", label: "Last 3 months" },
  { value: "6months", label: "Last 6 months" },
  { value: "all", label: "All time" },
];

const paceColors: Record<string, string> = {
  casual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  moderate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  fast: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  race: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function PastRidesPage() {
  const { formatDistance } = useUnits();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPace, setSelectedPace] = useState("all");
  const [timeRange, setTimeRange] = useState("30days");

  useEffect(() => {
    async function fetchPastRides() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/rides/past");
        if (response.ok) {
          const data = await response.json();
          setRides(data);
        }
      } catch (error) {
        console.error("Failed to fetch past rides:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPastRides();
  }, []);

  const filteredRides = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (timeRange) {
      case "14days":
        startDate = subDays(now, 14);
        break;
      case "30days":
        startDate = subDays(now, 30);
        break;
      case "3months":
        startDate = subMonths(now, 3);
        break;
      case "6months":
        startDate = subMonths(now, 6);
        break;
      case "all":
      default:
        startDate = null;
    }

    return rides.filter((ride) => {
      // Time range filter
      if (startDate) {
        const rideDate = parseISO(ride.date);
        if (isBefore(rideDate, startDate)) {
          return false;
        }
      }

      // Pace filter
      if (selectedPace !== "all" && ride.pace !== selectedPace) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ride.title.toLowerCase().includes(query);
        const matchesLocation = ride.location.toLowerCase().includes(query);
        const matchesOrganizer = ride.organizer.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesOrganizer) {
          return false;
        }
      }

      return true;
    });
  }, [rides, timeRange, selectedPace, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/discover">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Discover
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Past Rides Archive</h1>
          <p className="text-muted-foreground mt-2">
            Browse rides that have already taken place
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rides, locations, organizers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ClockIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPace} onValueChange={setSelectedPace}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Pace" />
            </SelectTrigger>
            <SelectContent>
              {PACE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredRides.length} past {filteredRides.length === 1 ? "ride" : "rides"} found
        </p>

        {/* Rides list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRides.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No past rides found matching your criteria.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedPace("all");
                setTimeRange("all");
              }}
            >
              Clear filters
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRides.map((ride) => (
              <Link key={ride.id} href={`/rides/${ride.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer opacity-80 hover:opacity-100">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Brand logo for community rides */}
                        {ride.brand?.logo && (
                          <div
                            className="h-7 w-7 rounded flex-shrink-0 p-0.5"
                            style={{ backgroundColor: ride.brand.primaryColor || '#f3f4f6' }}
                          >
                            <img
                              src={ride.brand.logoIcon || ride.brand.logo}
                              alt={ride.brand.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <CardTitle className="text-lg line-clamp-2">{ride.title}</CardTitle>
                      </div>
                      <Badge className={paceColors[ride.pace] || "bg-gray-100"}>
                        {ride.pace}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{format(parseISO(ride.date), "EEEE, MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{ride.locationName || ride.location}</span>
                    </div>
                    {ride.distance && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg
                          className="h-4 w-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        <span>{formatDistance(ride.distance)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                      <UsersIcon className="h-4 w-4 flex-shrink-0" />
                      <span>by {ride.organizer.name}</span>
                      {ride._count?.rsvps !== undefined && ride._count.rsvps > 0 && (
                        <span className="ml-auto">{ride._count.rsvps} attended</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
