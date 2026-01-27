'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Shield,
  Users,
  Building2,
  MapPin,
  Bike,
  Calendar,
  UserPlus,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  _count: {
    rsvps: number;
    chapters: number;
  };
}

interface TopCommunity {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  chapterCount: number;
  rideCount: number;
}

interface RidesByMonth {
  month: string;
  count: number;
}

interface Analytics {
  overview: {
    totalUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    totalCommunities: number;
    totalChapters: number;
    totalRides: number;
    upcomingRides: number;
    pastRides: number;
    totalRsvps: number;
  };
  recentUsers: RecentUser[];
  topCommunities: TopCommunity[];
  ridesByMonth: RidesByMonth[];
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPlatformAdmin = session?.user?.role === 'PLATFORM_ADMIN';

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin/analytics');
      return;
    }

    if (session.user?.role !== 'PLATFORM_ADMIN') {
      setError('You do not have permission to access this page');
      setIsLoading(false);
      return;
    }

    loadAnalytics();
  }, [session, status, router]);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
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

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const maxRidesInMonth = Math.max(...analytics.ridesByMonth.map((r) => r.count), 1);

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Platform Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Overview of platform activity and user engagement
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/communities">
                <Building2 className="h-4 w-4 mr-2" />
                Communities
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.overview.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.overview.newUsers7d}</p>
                  <p className="text-xs text-muted-foreground">New (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.overview.totalCommunities}</p>
                  <p className="text-xs text-muted-foreground">Communities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <MapPin className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.overview.totalChapters}</p>
                  <p className="text-xs text-muted-foreground">Chapters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <Bike className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics.overview.totalRides}</p>
                  <p className="text-xs text-muted-foreground">Total Rides</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{analytics.overview.newUsers30d}</p>
            <p className="text-xs text-muted-foreground">New Users (30d)</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{analytics.overview.upcomingRides}</p>
            <p className="text-xs text-muted-foreground">Upcoming Rides</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{analytics.overview.pastRides}</p>
            <p className="text-xs text-muted-foreground">Past Rides</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-xl font-bold">{analytics.overview.totalRsvps}</p>
            <p className="text-xs text-muted-foreground">Total RSVPs</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent User Signups */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Recent Signups
              </CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {analytics.recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.name || 'No name'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user._count.rsvps} RSVPs, {user._count.chapters} teams
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rides by Month Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rides Created
              </CardTitle>
              <CardDescription>Monthly ride creation (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.ridesByMonth.length > 0 ? (
                <div className="space-y-3">
                  {analytics.ridesByMonth.map((month) => (
                    <div key={month.month} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-muted-foreground shrink-0">
                        {formatMonth(month.month)}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(month.count / maxRidesInMonth) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-sm font-medium text-right">
                        {month.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No ride data for the last 6 months
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Communities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top Communities
              </CardTitle>
              <CardDescription>Communities ranked by total rides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.topCommunities.map((community, index) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      {community.logo ? (
                        <img
                          src={community.logo}
                          alt={community.name}
                          className="h-10 w-10 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{community.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {community.chapterCount} chapters, {community.rideCount} rides
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
