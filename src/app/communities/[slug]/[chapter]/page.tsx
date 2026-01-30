"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  MapPin,
  Users,
  Bike,
  Plus,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  Settings,
  MessageCircle,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  ExternalLink,
  ChevronLeft,
  Route,
} from "lucide-react";
import { useUnits } from "@/components/providers/units-provider";
import { CopyableUrl } from "@/components/ui/copyable-url";
import { BrandLogo } from "@/components/brand-logo";

// Note: generateMetadata is in layout.tsx for this client component
// This allows server-side metadata generation while keeping the page interactive

// Arrow icon component
const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

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
  // Website/domain
  domain: string | null;
  // Social links
  inheritSocialLinks: boolean;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  strava: string | null;
  youtube: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    logoDark: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    domain: string | null;
    // Brand social links (for inheritance)
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    strava: string | null;
    youtube: string | null;
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
        // Merge brand social links from the brand API response
        setChapter({
          ...fullChapter,
          brand: {
            ...fullChapter.brand,
            logoDark: brand.logoDark || null,
            instagram: brand.instagram || null,
            twitter: brand.twitter || null,
            facebook: brand.facebook || null,
            strava: brand.strava || null,
            youtube: brand.youtube || null,
          },
        });
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
          <h1 className="text-2xl font-bold uppercase mb-2">
            {error || "Chapter not found"}
          </h1>
          <Link
            href="/communities"
            className="text-sm text-muted-foreground hover:text-foreground uppercase tracking-wider"
          >
            Back to Communities
          </Link>
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

  // Get social links (inherited or chapter-specific)
  const socialLinks = chapter.inheritSocialLinks !== false
    ? {
        instagram: chapter.brand.instagram,
        twitter: chapter.brand.twitter,
        facebook: chapter.brand.facebook,
        strava: chapter.brand.strava,
        youtube: chapter.brand.youtube,
      }
    : {
        instagram: chapter.instagram,
        twitter: chapter.twitter,
        facebook: chapter.facebook,
        strava: chapter.strava,
        youtube: chapter.youtube,
      };

  const hasSocialLinks = socialLinks.instagram || socialLinks.twitter || socialLinks.facebook || socialLinks.strava || socialLinks.youtube;
  const hasChatLinks = chapter.telegram || chapter.whatsapp || chapter.discord || chapter.signal;

  const normalizeUrl = (value: string | null, platform: string) => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    switch (platform) {
      case 'instagram': return `https://instagram.com/${value.replace('@', '')}`;
      case 'twitter': return `https://twitter.com/${value.replace('@', '')}`;
      case 'facebook': return `https://facebook.com/${value}`;
      default: return value;
    }
  };

  // Get website domain (inherited or chapter-specific)
  const domain = chapter.inheritSocialLinks !== false
    ? chapter.brand.domain
    : (chapter.domain || chapter.brand.domain);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 md:px-[60px] py-12 md:py-[60px] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-[120px]">

        {/* Left Column - Rides List */}
        <main>
          {/* Back link */}
          <Link
            href={`/communities/${chapter.brand.slug}`}
            className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {chapter.brand.name}
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="label-editorial">Upcoming Rides</span>
            {canEdit && (
              <Link
                href={`/communities/${chapter.brand.slug}/${chapter.slug}/edit`}
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            )}
          </div>

          {/* Rides List */}
          <div className="w-full border-t border-border">
            {chapter.rides.length === 0 ? (
              <div className="text-center py-16">
                <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No upcoming rides</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Be the first to organize a ride for {chapter.brand.name} {chapter.name}.
                </p>
                <Link href={`/create?chapterId=${chapter.id}`} className="cta-link">
                  <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
                    <Plus className="w-2.5 h-2.5" />
                  </div>
                  Create a Ride
                </Link>
              </div>
            ) : (
              <>
                {chapter.rides.map((ride) => (
                  <Link
                    key={ride.id}
                    href={`/rides/${ride.id}`}
                    className="list-item-editorial group"
                  >
                    {/* Date */}
                    <div className="hidden md:flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground uppercase">
                        {format(new Date(ride.date), 'MMM')}
                      </span>
                      <span className="text-2xl font-normal">
                        {format(new Date(ride.date), 'd')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="pr-6">
                      <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {format(new Date(ride.date), 'EEE, MMM d').toUpperCase()} • {format(new Date(ride.date), 'h:mm a').toUpperCase()}
                      </div>
                      <div className="text-lg md:text-[22px] font-normal uppercase mb-1">
                        {ride.title}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                        <span className="after:content-['•'] after:ml-3 after:opacity-40 hidden md:inline">
                          {format(new Date(ride.date), 'h:mm a')}
                        </span>
                        <span className="after:content-['•'] after:ml-3 after:opacity-40">
                          {ride.locationName}
                        </span>
                        {ride.distance && (
                          <span className="after:content-['•'] after:ml-3 after:opacity-40">
                            {formatDistance(ride.distance)}
                          </span>
                        )}
                        <span>
                          {ride._count.rsvps} going
                        </span>
                      </div>
                    </div>

                    {/* Arrow button */}
                    <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                      <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Create Ride CTA - below rides list */}
          <Link href={`/create?chapterId=${chapter.id}`} className="cta-link mt-8">
            <div className="w-5 h-5 border border-foreground rounded-full flex items-center justify-center">
              <Plus className="w-2.5 h-2.5" />
            </div>
            Create Ride
          </Link>

          {/* Past Rides Section */}
          {chapter.rideCount > chapter.rides.length && (
            <div className="mt-12">
              <button
                onClick={handleTogglePastRides}
                className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <History className="h-4 w-4" />
                <span>Past Rides</span>
                {showPastRides ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </button>

              {showPastRides && (
                <div className="w-full border-t border-border mt-4">
                  {loadingPastRides ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : chapter.pastRides && chapter.pastRides.length > 0 ? (
                    chapter.pastRides.map((ride) => (
                      <Link
                        key={ride.id}
                        href={`/rides/${ride.id}`}
                        className="list-item-editorial group opacity-70 hover:opacity-100"
                      >
                        {/* Date */}
                        <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {format(new Date(ride.date), 'MMM d, yyyy')}
                        </div>

                        {/* Content */}
                        <div className="pr-6">
                          <div className="md:hidden text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            {format(new Date(ride.date), 'MMM d, yyyy').toUpperCase()}
                          </div>
                          <div className="text-lg md:text-[22px] font-normal uppercase mb-1">
                            {ride.title}
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 items-center">
                            <span className="after:content-['•'] after:ml-3 after:opacity-40">
                              {ride.locationName}
                            </span>
                            {ride.distance && (
                              <span>
                                {formatDistance(ride.distance)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow button */}
                        <div className="icon-btn-circle transition-all group-hover:bg-foreground">
                          <ArrowIcon className="w-4 h-4 stroke-foreground group-hover:stroke-background transition-all" />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No past rides found
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Column - Chapter Info */}
        <aside className="lg:sticky lg:top-10 order-first lg:order-last">
          {/* Chapter Header */}
          <div className="flex items-start gap-6 mb-8">
            {chapter.brand.logo ? (
              <BrandLogo
                logo={chapter.brand.logo}
                logoDark={chapter.brand.logoDark}
                name={chapter.brand.name}
                primaryColor={chapter.brand.primaryColor}
                className="h-20 w-20"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold">
                {chapter.brand.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-normal uppercase tracking-tight">
                {chapter.brand.name} {chapter.name}
              </h1>
              <p className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {chapter.city}
              </p>
            </div>
          </div>

          {/* Chapter URL */}
          <div className="mb-6">
            <CopyableUrl
              url={`https://rideswith.com/${chapter.brand.slug}/${chapter.slug}`}
              displayUrl={`rideswith.com/${chapter.brand.slug}/${chapter.slug}`}
            />
          </div>

          {/* Website */}
          {domain && (
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <Globe className="h-4 w-4" />
              {domain}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex items-center gap-4 mb-6">
              {socialLinks.instagram && (
                <a href={normalizeUrl(socialLinks.instagram, 'instagram') || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={normalizeUrl(socialLinks.twitter, 'twitter') || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="X / Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={normalizeUrl(socialLinks.facebook, 'facebook') || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.strava && (
                <a href={socialLinks.strava} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Strava Club">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="YouTube">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          )}

          {/* Community Chat Links */}
          {hasChatLinks && (
            <div className="mb-8">
              <span className="label-editorial block mb-4">Join the Community</span>
              <div className="flex flex-wrap gap-2">
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
          )}

          {/* Stats - hidden on mobile */}
          <div className="hidden md:block mb-8">
            <span className="label-editorial block mb-4">Chapter Stats</span>

            <div className="stat-row">
              <span className="stat-value">{chapter.memberCount}</span>
              <span className="stat-label">Ambassadors</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{chapter.rides.length}</span>
              <span className="stat-label">Upcoming Rides</span>
            </div>
            <div className="stat-row">
              <span className="stat-value">{chapter.rideCount}</span>
              <span className="stat-label">Total Rides</span>
            </div>
          </div>

          {/* Chapter Team */}
          <div>
            <span className="label-editorial block mb-4">Chapter Team</span>

            {/* Owners */}
            {owners.length > 0 && (
              <div className="mb-4">
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
              <div className="mb-4">
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
          </div>
        </aside>
      </div>
    </div>
  );
}
