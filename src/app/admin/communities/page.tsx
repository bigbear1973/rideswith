'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Shield,
  Search,
  Building2,
  Users,
  UsersRound,
  Trophy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MapPin,
} from 'lucide-react';

interface Chapter {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  sponsorsEnabled: boolean | null;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  type: 'BRAND' | 'CLUB' | 'TEAM' | 'GROUP';
  logo: string | null;
  sponsorsEnabled: boolean;
  chapters: Chapter[];
  _count?: {
    chapters: number;
  };
  createdBy?: {
    name: string | null;
    email: string;
  } | null;
}

const COMMUNITY_TYPE_ICONS = {
  BRAND: Building2,
  CLUB: Users,
  TEAM: Trophy,
  GROUP: UsersRound,
};

const COMMUNITY_TYPE_COLORS = {
  BRAND: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  CLUB: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  TEAM: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  GROUP: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export default function AdminCommunitiesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set());

  const isPlatformAdmin = session?.user?.role === 'PLATFORM_ADMIN';

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin/communities');
      return;
    }

    if (session.user?.role !== 'PLATFORM_ADMIN') {
      setError('You do not have permission to access this page');
      setIsLoading(false);
      return;
    }

    loadCommunities();
  }, [session, status, router]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCommunities(communities);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCommunities(
        communities.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.slug.toLowerCase().includes(query) ||
            c.createdBy?.email?.toLowerCase().includes(query) ||
            c.createdBy?.name?.toLowerCase().includes(query) ||
            c.chapters.some(
              (ch) =>
                ch.name.toLowerCase().includes(query) ||
                ch.city?.toLowerCase().includes(query)
            )
        )
      );
    }
  }, [searchQuery, communities]);

  const loadCommunities = async () => {
    try {
      const res = await fetch('/api/admin/communities');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data.communities || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load communities');
      }
    } catch {
      setError('Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSponsorsEnabled = async (communityId: string, currentValue: boolean) => {
    setUpdating(communityId);
    try {
      const res = await fetch(`/api/admin/communities/${communityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorsEnabled: !currentValue }),
      });

      if (res.ok) {
        setCommunities(
          communities.map((c) =>
            c.id === communityId ? { ...c, sponsorsEnabled: !currentValue } : c
          )
        );
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update community');
      }
    } catch {
      setError('Failed to update community');
    } finally {
      setUpdating(null);
    }
  };

  const toggleChapterSponsors = async (
    communityId: string,
    chapterId: string,
    currentValue: boolean | null
  ) => {
    setUpdating(chapterId);
    // Toggle: null/true -> false (disable), false -> null (inherit/enable)
    const newValue = currentValue === false ? null : false;

    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorsEnabled: newValue }),
      });

      if (res.ok) {
        setCommunities(
          communities.map((c) =>
            c.id === communityId
              ? {
                  ...c,
                  chapters: c.chapters.map((ch) =>
                    ch.id === chapterId ? { ...ch, sponsorsEnabled: newValue } : ch
                  ),
                }
              : c
          )
        );
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update chapter');
      }
    } catch {
      setError('Failed to update chapter');
    } finally {
      setUpdating(null);
    }
  };

  const toggleExpanded = (communityId: string) => {
    const newExpanded = new Set(expandedCommunities);
    if (newExpanded.has(communityId)) {
      newExpanded.delete(communityId);
    } else {
      newExpanded.add(communityId);
    }
    setExpandedCommunities(newExpanded);
  };

  const getChapterStatusLabel = (chapter: Chapter, brandEnabled: boolean) => {
    if (chapter.sponsorsEnabled === false) {
      return { label: 'Disabled', color: 'text-red-600', effective: false };
    }
    // null or true = inherit from brand
    if (brandEnabled) {
      return { label: 'Inherit (On)', color: 'text-green-600', effective: true };
    } else {
      return { label: 'Inherit (Off)', color: 'text-muted-foreground', effective: false };
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-4">
                You do not have permission to access the admin panel.
              </p>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Platform Admin</h1>
          </div>
          <p className="text-muted-foreground">
            Manage communities and control feature access
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Communities</CardTitle>
            <CardDescription>
              Toggle sponsors feature for each community and chapter. Click on a community
              to expand and manage chapter-level settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, slug, city, or owner..."
                className="pl-9"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">{communities.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {communities.filter((c) => c.sponsorsEnabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Sponsors Enabled</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">
                  {communities.filter((c) => !c.sponsorsEnabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Sponsors Disabled</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">
                  {communities.reduce((sum, c) => sum + (c.chapters?.length || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Chapters</p>
              </div>
            </div>

            {/* Community List */}
            <div className="space-y-2">
              {filteredCommunities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No communities match your search' : 'No communities found'}
                </p>
              ) : (
                filteredCommunities.map((community) => {
                  const TypeIcon = COMMUNITY_TYPE_ICONS[community.type];
                  const isExpanded = expandedCommunities.has(community.id);
                  const hasChapters = community.chapters && community.chapters.length > 0;

                  return (
                    <div key={community.id} className="rounded-lg border bg-card overflow-hidden">
                      {/* Community Row */}
                      <div className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Expand toggle */}
                          {hasChapters ? (
                            <button
                              onClick={() => toggleExpanded(community.id)}
                              className="p-1 hover:bg-muted rounded mt-1 shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 shrink-0" />
                          )}

                          {/* Logo */}
                          <div className="shrink-0">
                            {community.logo ? (
                              <img
                                src={community.logo}
                                alt={community.name}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-contain"
                              />
                            ) : (
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-muted flex items-center justify-center">
                                <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info - stacks on mobile */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${COMMUNITY_TYPE_COLORS[community.type]}`}
                              >
                                {community.type}
                              </Badge>
                              <Link
                                href={`/communities/${community.slug}`}
                                target="_blank"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                            <Link
                              href={`/communities/${community.slug}`}
                              className="font-medium hover:underline line-clamp-1"
                            >
                              {community.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
                              <span className="font-mono">/{community.slug}</span>
                              {hasChapters && (
                                <span className="hidden sm:inline">{community.chapters.length} chapters</span>
                              )}
                            </div>

                            {/* Sponsor toggle on mobile - below info */}
                            <div className="mt-3">
                              <Button
                                variant={community.sponsorsEnabled ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleSponsorsEnabled(community.id, community.sponsorsEnabled)}
                                disabled={updating === community.id}
                                className={community.sponsorsEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                {updating === community.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : community.sponsorsEnabled ? (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Sponsors On
                                  </>
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Sponsors Off
                                  </>
                                )}
                              </Button>
                              {hasChapters && (
                                <span className="ml-2 text-xs text-muted-foreground sm:hidden">
                                  {community.chapters.length} chapters
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Chapters (expanded) */}
                      {isExpanded && hasChapters && (
                        <div className="border-t bg-muted/30">
                          {community.chapters.map((chapter) => {
                            const chapterStatus = getChapterStatusLabel(chapter, community.sponsorsEnabled);
                            return (
                              <div
                                key={chapter.id}
                                className="px-4 py-3 pl-8 sm:pl-16 border-b last:border-b-0 hover:bg-muted/50"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Chapter icon */}
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                  </div>

                                  {/* Chapter info and actions */}
                                  <div className="flex-1 min-w-0">
                                    <Link
                                      href={`/communities/${community.slug}/${chapter.slug}`}
                                      className="font-medium text-sm hover:underline"
                                    >
                                      {chapter.name}
                                    </Link>
                                    {chapter.city && (
                                      <p className="text-xs text-muted-foreground">{chapter.city}</p>
                                    )}

                                    {/* Chapter sponsor controls - below info on mobile */}
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <span className={`text-xs ${chapterStatus.color}`}>
                                        {chapterStatus.label}
                                      </span>
                                      <Button
                                        variant={chapter.sponsorsEnabled === false ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={() =>
                                          toggleChapterSponsors(
                                            community.id,
                                            chapter.id,
                                            chapter.sponsorsEnabled
                                          )
                                        }
                                        disabled={updating === chapter.id}
                                        className={`h-7 text-xs ${chapter.sponsorsEnabled !== false ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                      >
                                        {updating === chapter.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : chapter.sponsorsEnabled === false ? (
                                          'Enable'
                                        ) : (
                                          'Disable'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
