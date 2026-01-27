"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
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
  History,
  ChevronDown,
  ChevronUp,
  Settings,
  MessageCircle,
} from "lucide-react";
import { useUnits } from "@/components/providers/units-provider";
import { CopyableUrl } from "@/components/ui/copyable-url";

interface PageProps {
  params: Promise<{ slug: string; chapter: string }>;
}

interface RideData {
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
}

interface ChapterData {
  id: string;
  name: string;
  slug: string;
  city: string;
  memberCount: number;
  rideCount: number;
  telegram: string | null;
  whatsapp: string | null;
  discord: string | null;
  signal: string | null;
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
    role: "OWNER" | "ADMIN" | "MODERATOR" | "LEAD" | "AMBASSADOR";
    user: {
      id: string;
      name: string | null;
      image: string | null;
      slug: string | null;
    };
  }>;
  rides: RideData[];
  pastRides?: RideData[];
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
  const [showPastRides, setShowPastRides] = useState(false);
  const [loadingPastRides, setLoadingPastRides] = useState(false);
  const [brandOwnerId, setBrandOwnerId] = useState<string | null>(null);
  const { formatDistance } = useUnits();
  const { data: session } = useSession();

  useEffect(() => {
    async function loadChapter() {
      try {
        const { slug, chapter: chapterSlug } = await params;

        // First get the brand to find the chapter
        const brandRes = await fetch(`/api/communities/${slug}`);
        if (!brandRes.ok) {
          if (brandRes.status === 404) {
            setError("Brand not found");
            return;
          }
          throw new Error("Failed to fetch brand");
        }

        const brand = await brandRes.json();
        setBrandOwnerId(brand.createdById);
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

  // Load past rides when toggled
  const loadPastRides = async () => {
    if (!chapter || chapter.pastRides) return;

    setLoadingPastRides(true);
    try {
      const res = await fetch(`/api/chapters/${chapter.id}?includePastRides=true`);
      if (res.ok) {
        const data = await res.json();
        setChapter((prev) => prev ? { ...prev, pastRides: data.pastRides } : null);
      }
    } catch (err) {
      console.error("Error loading past rides:", err);
    } finally {
      setLoadingPastRides(false);
    }
  };

  const handleTogglePastRides = () => {
    if (!showPastRides && !chapter?.pastRides) {
      loadPastRides();
    }
    setShowPastRides(!showPastRides);
  };

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
            <Link href="/communities">Back to Communities</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Handle both new roles (OWNER/ADMIN/MODERATOR) and legacy roles (LEAD/AMBASSADOR)
  const owners = chapter.members.filter((m) => m.role === "OWNER" || m.role === "LEAD");
  const admins = chapter.members.filter((m) => m.role === "ADMIN");
  const moderators = chapter.members.filter((m) => m.role === "MODERATOR" || m.role === "AMBASSADOR");

  // Check if current user can edit this chapter
  const canEdit = session?.user?.id && (
    brandOwnerId === session.user.id ||
    chapter.members.some(
      (m) => m.user.id === session.user?.id && ["OWNER", "ADMIN", "LEAD"].includes(m.role)
    )
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Brand Colors */}
      <div
        className="py-12 text-white"
        style={{ backgroundColor: chapter.brand.primaryColor || "#00D26A" }}
      >
        <div className="container mx-auto px-4">
          <Link
            href={`/communities/${chapter.brand.slug}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {chapter.brand.name}
          </Link>

          <div className="flex items-center justify-between">
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
                {/* Vanity URL */}
                <div className="mt-2 [&_a]:text-white/70 [&_a:hover]:text-white [&_button]:text-white/70 [&_button:hover]:text-white">
                  <CopyableUrl
                    url={`https://rideswith.com/${chapter.brand.slug}/${chapter.slug}`}
                    displayUrl={`rideswith.com/${chapter.brand.slug}/${chapter.slug}`}
                  />
                </div>
              </div>
            </div>
            {canEdit && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link href={`/communities/${chapter.brand.slug}/${chapter.slug}/edit`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
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

      {/* Community Chat Links */}
      {(chapter.telegram || chapter.whatsapp || chapter.discord || chapter.signal) && (
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Join the community:
              </span>
              {chapter.telegram && (
                <a
                  href={chapter.telegram.startsWith('http') ? chapter.telegram : `https://t.me/${chapter.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#26A5E4] text-white hover:bg-[#26A5E4]/90 transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </a>
              )}
              {chapter.whatsapp && (
                <a
                  href={chapter.whatsapp.startsWith('http') ? chapter.whatsapp : `https://chat.whatsapp.com/${chapter.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white hover:bg-[#25D366]/90 transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              {chapter.discord && (
                <a
                  href={chapter.discord.startsWith('http') ? chapter.discord : `https://discord.gg/${chapter.discord}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5865F2] text-white hover:bg-[#5865F2]/90 transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                  Discord
                </a>
              )}
              {chapter.signal && (
                <a
                  href={chapter.signal.startsWith('http') ? chapter.signal : `https://signal.group/${chapter.signal}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3A76F0] text-white hover:bg-[#3A76F0]/90 transition-colors text-sm font-medium"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.828.94z"/>
                  </svg>
                  Signal
                </a>
              )}
            </div>
          </div>
        </div>
      )}

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
                    <Link href={`/create?chapterId=${chapter.id}`}>Create a Ride</Link>
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

            {/* Past Rides Section */}
            {chapter.rideCount > chapter.rides.length && (
              <div className="mt-8">
                <button
                  onClick={handleTogglePastRides}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <History className="h-4 w-4" />
                  <span className="font-medium">Past Rides</span>
                  {showPastRides ? (
                    <ChevronUp className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  )}
                </button>

                {showPastRides && (
                  <div className="mt-4 space-y-4">
                    {loadingPastRides ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : chapter.pastRides && chapter.pastRides.length > 0 ? (
                      chapter.pastRides.map((ride) => (
                        <Link key={ride.id} href={`/rides/${ride.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-75 hover:opacity-100">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">
                                    {ride.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {format(new Date(ride.date), "EEE, MMM d, yyyy")}
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
                                {ride._count.rsvps} attended
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No past rides found
                      </p>
                    )}
                  </div>
                )}
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
                {/* Owners */}
                {owners.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {owners.length === 1 ? "Owner" : "Owners"}
                    </p>
                    <div className="space-y-1">
                      {owners.map((member) => (
                        <Link
                          key={member.id}
                          href={
                            member.user.slug
                              ? `/u/${member.user.slug}`
                              : `/profile/${member.user.id}`
                          }
                          className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 -mx-2 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.user.image || undefined}
                              alt={member.user.name || ""}
                            />
                            <AvatarFallback>
                              {member.user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {member.user.name || "Unknown"}
                              </span>
                              <VerifiedBadge />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Owner
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admins */}
                {admins.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {admins.length === 1 ? "Admin" : "Admins"}
                    </p>
                    <div className="space-y-1">
                      {admins.map((member) => (
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

                {/* Moderators */}
                {moderators.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                      {moderators.length === 1 ? "Moderator" : "Moderators"}
                    </p>
                    <div className="space-y-1">
                      {moderators.map((member) => (
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
