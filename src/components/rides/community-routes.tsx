'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RideRoute {
  id: string;
  platform: string;
  url: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    slug: string | null;
  };
}

interface CommunityRoutesProps {
  rideId: string;
}

// Platform colors
const PLATFORM_COLORS: Record<string, string> = {
  Komoot: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  RideWithGPS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Strava: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Garmin: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  Wahoo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  MapMyRide: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

// Extract clean URL for display
function getDisplayUrl(url: string): string {
  // If it's an iframe, extract the src
  if (url.trim().startsWith('<iframe')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      url = srcMatch[1];
    }
  }

  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname.substring(0, 30)}${urlObj.pathname.length > 30 ? '...' : ''}`;
  } catch {
    return url.substring(0, 40) + (url.length > 40 ? '...' : '');
  }
}

// Get link URL (extract from iframe if needed)
function getLinkUrl(url: string): string {
  if (url.trim().startsWith('<iframe')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      // For Komoot embeds, convert to tour URL
      const embedUrl = srcMatch[1];
      const tourMatch = embedUrl.match(/komoot\.com\/tour\/(\d+)/);
      if (tourMatch) {
        return `https://www.komoot.com/tour/${tourMatch[1]}`;
      }
      return embedUrl;
    }
  }
  return url;
}

export function CommunityRoutes({ rideId }: CommunityRoutesProps) {
  const { data: session } = useSession();
  const [routes, setRoutes] = useState<RideRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch routes
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch(`/api/rides/${rideId}/routes`);
        if (res.ok) {
          const data = await res.json();
          setRoutes(data);
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, [rideId]);

  // Add route
  async function handleAddRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch(`/api/rides/${rideId}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() }),
      });

      if (res.ok) {
        const route = await res.json();
        setRoutes([...routes, route]);
        setNewUrl('');
        setShowForm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add route');
      }
    } catch (err) {
      setError('Failed to add route');
    } finally {
      setAdding(false);
    }
  }

  // Delete route
  async function handleDeleteRoute(routeId: string) {
    try {
      const res = await fetch(`/api/rides/${rideId}/routes?routeId=${routeId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRoutes(routes.filter((r) => r.id !== routeId));
      }
    } catch (err) {
      console.error('Error deleting route:', err);
    }
  }

  if (loading) {
    return null; // Don't show loading state, just wait
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Route Links
          </CardTitle>
          {session?.user && !showForm && (
            <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing routes */}
        {routes.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">
            No route links yet.{' '}
            {session?.user ? (
              <button
                onClick={() => setShowForm(true)}
                className="text-primary hover:underline"
              >
                Add one?
              </button>
            ) : (
              'Sign in to add one.'
            )}
          </p>
        )}

        {routes.map((route) => (
          <div
            key={route.id}
            className="flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-muted/50 group"
          >
            <Badge variant="secondary" className={PLATFORM_COLORS[route.platform] || PLATFORM_COLORS.Other}>
              {route.platform}
            </Badge>
            <a
              href={getLinkUrl(route.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-primary hover:underline truncate flex items-center gap-1"
            >
              {getDisplayUrl(route.url)}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              by{' '}
              {route.user.slug ? (
                <Link href={`/u/${route.user.slug}`} className="hover:underline">
                  {route.user.name || 'User'}
                </Link>
              ) : (
                route.user.name || 'User'
              )}
            </span>
            {session?.user?.id === route.user.id && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteRoute(route.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        ))}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAddRoute} className="space-y-2">
            <Input
              placeholder="Paste Komoot, RideWithGPS, Strava, or Garmin URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding || !newUrl.trim()}>
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Route'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setNewUrl('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share your route from Komoot, RideWithGPS, Strava, or Garmin. You can paste a URL or embed code.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
