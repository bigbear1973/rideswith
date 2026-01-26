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
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  slug: string;
  type: 'BRAND' | 'CLUB' | 'TEAM' | 'GROUP';
  logo: string | null;
  sponsorsEnabled: boolean;
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
            c.createdBy?.name?.toLowerCase().includes(query)
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
              Toggle sponsors feature for each community. Communities with sponsors enabled
              can add sponsors to their ride pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, slug, or owner..."
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
                  {communities.reduce((sum, c) => sum + (c._count?.chapters || 0), 0)}
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
                  return (
                    <div
                      key={community.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* Logo */}
                      {community.logo ? (
                        <img
                          src={community.logo}
                          alt={community.name}
                          className="h-12 w-12 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <TypeIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/communities/${community.slug}`}
                            className="font-medium hover:underline truncate"
                          >
                            {community.name}
                          </Link>
                          <Badge
                            variant="secondary"
                            className={COMMUNITY_TYPE_COLORS[community.type]}
                          >
                            {community.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>/{community.slug}</span>
                          {community._count?.chapters ? (
                            <span>{community._count.chapters} chapters</span>
                          ) : null}
                          {community.createdBy && (
                            <span className="truncate">
                              Owner: {community.createdBy.name || community.createdBy.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/communities/${community.slug}`}
                          target="_blank"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>

                        {/* Sponsors Toggle */}
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
                      </div>
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
