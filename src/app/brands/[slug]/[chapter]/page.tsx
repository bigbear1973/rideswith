"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  MapPin,
  Users,
  Bike,
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useUnits } from "@/components/providers/units-provider";

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

interface ChapterData {
  id: string;
  name: string;
  slug: string;
  city: string;
  memberCount: number;
  rideCount: number;
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    domain: string | null;
  };
  members: Array<{
    id: string;
    role: "LEAD" | "AMBASSADOR";
    user: {
      id: string;
      name: string | null;
      image: string | null;
      slug: string | null;
    };
  }>;
  rides: Array<{
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
    _count: {
      rsvps: number;
    };
  }>;
}

const PACE_STYLES: Record<string, string> = {
  casual: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  moderate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  fast: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  race: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function ChapterPage({ params }: PageProps) {
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatDistance } = useUnits();

  useEffect(() => {
    async function loadChapter() {
      try {
        const { slug, chapter: chapterSlug } = await params;

        // First get the brand to find the chapter
        const brandRes = await fetch(`/api/brands/${slug}`);
        if (!brandRes.ok) {
          if (brandRes.status === 404) {
            setError("Brand not found");
            return;
          }
          throw new Error("Failed to fetch brand");
        }

        const brand = await brandRes.json();
        const chapterData = brand.chapters.find(
          (c: { slug: string }) => c.slug === chapterSlug
        );

        if (!chapterData) {
          setError("Chapter not found");
          return;
        }

        // Fetch full chapter details
        const chapterRes = await fetch(`/api/chapters/${chapterData.id}`);
        if (!chapterRes.ok) {
          throw new Error("Failed to fetch chapter details");
        }

        const fullChapter = await chapterRes.json();
        setChapter(fullChapter);
      } catch (err) {
        console.error("Error loading chapter:", err);
        setError("Failed to load chapter");
      } finally {
        setLoading(false);
      }
    }

    loadChapter();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {error || "Chapter not found"}
          </h1>
          <Button asChild variant="outline">
            <Link href="/brands">Back to Brands</Link>
          </Button>
        </div>
      </div>
    );
  }

  const lead = chapter.members.find((m) => m.role === "LEAD");
  const ambassadors = chapter.members.filter((m) => m.role === "AMBASSADOR");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Brand Colors */}
      <div
        className="py-12 text-white"
        style={{ backgroundColor: chapter.brand.primaryColor || "#00D26A" }}
      >
        <div className="container mx-auto px-4">
          <Link
            href={`/brands/${chapter.brand.slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {chapter.brand.name}
          </Link>

          <div className="flex items-center gap-6">
            {chapter.brand.logo ? (
              <img
                src={chapter.brand.logo}
                alt={chapter.brand.name}
                className="h-16 w-16 object-contain rounded-lg bg-white p-2"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center text-2xl font-bold">
                {chapter.brand.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {chapter.brand.name} {chapter.name}
              </h1>
              <p className="text-white/80 flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {chapter.city}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-xl md:text-2xl font-bold">
                {chapter.memberCount}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Ambassadors
              </div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold">
                {chapter.rides.length}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Upcoming Rides
              </div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold">
                {chapter.rideCount}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                Total Rides
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column - Rides */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Upcoming Rides</h2>
              <Button asChild size="sm">
                <Link href={`/create?chapterId=${chapter.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ride
                </Link>
              </Button>
            </div>

            {chapter.rides.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No upcoming rides
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to organize a ride for {chapter.brand.name}{" "}
                    {chapter.name}.
                  </p>
                  <Button asChild>
                    <Link href="/create">Create a Ride</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {chapter.rides.map((ride) => (
                  <Link key={ride.id} href={`/rides/${ride.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {ride.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(ride.date), "EEE, MMM d")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(ride.date), "h:mm a")}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {ride.locationName}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={
                                PACE_STYLES[ride.pace.toLowerCase()] || ""
                              }
                            >
                              {ride.pace}
                            </Badge>
                            {ride.distance && (
                              <span className="text-sm text-muted-foreground">
                                {formatDistance(ride.distance)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {ride._count.rsvps} going
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Team */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chapter Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chapter Lead */}
                {lead && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Chapter Lead
                    </p>
                    <Link
                      href={
                        lead.user.slug
                          ? `/u/${lead.user.slug}`
                          : `/profile/${lead.user.id}`
                      }
                      className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={lead.user.image || undefined}
                          alt={lead.user.name || ""}
                        />
                        <AvatarFallback>
                          {lead.user.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {lead.user.name || "Unknown"}
                          </span>
                          <VerifiedBadge />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Lead
                        </span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Ambassadors */}
                {ambassadors.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      Ambassadors
                    </p>
                    <div className="space-y-1">
                      {ambassadors.map((member) => (
                        <Link
                          key={member.id}
                          href={
                            member.user.slug
                              ? `/u/${member.user.slug}`
                              : `/profile/${member.user.id}`
                          }
                          className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 -mx-2 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.user.image || undefined}
                              alt={member.user.name || ""}
                            />
                            <AvatarFallback className="text-xs">
                              {member.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              {member.user.name || "Unknown"}
                            </span>
                            <VerifiedBadge />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
