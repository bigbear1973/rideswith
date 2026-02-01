'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Unlink,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { StravaConnectButton, StravaIcon } from './strava-connect';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Club {
  id: string;
  name: string;
  profileMedium: string;
  city: string;
  state: string;
  country: string;
  memberCount: number;
  isAdmin: boolean;
}

interface SyncStatus {
  connected: boolean;
  clubId?: string;
  clubName?: string;
  autoSync?: boolean;
  lastSyncAt?: string;
  lastSyncError?: string;
  syncedRideCount?: number;
  connectedBy?: string;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface StravaSyncSettingsProps {
  chapterId: string;
  showClubSelection?: boolean;
  createRideUrl?: string;
}

export function StravaSyncSettings({
  chapterId,
  showClubSelection = false,
  createRideUrl,
}: StravaSyncSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClubs, setShowClubs] = useState(showClubSelection);

  // Load sync status
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/strava/sync/${chapterId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);

        // If connected but no club selected, show club selection
        if (data.connected && !data.clubId) {
          setShowClubs(true);
        }
      }
    } catch (err) {
      console.error('Failed to load Strava status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Load clubs when showing selection
  useEffect(() => {
    if (showClubs && status?.connected && clubs.length === 0) {
      loadClubs();
    }
  }, [showClubs, status?.connected, clubs.length]);

  const loadClubs = async () => {
    setIsLoadingClubs(true);
    try {
      const res = await fetch(`/api/strava/clubs?chapterId=${chapterId}`);
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load clubs');
      }
    } catch {
      setError('Failed to load Strava clubs');
    } finally {
      setIsLoadingClubs(false);
    }
  };

  const selectClub = async (club: Club) => {
    setIsSyncing(true);
    setSyncResult(null);
    setError(null);

    try {
      const res = await fetch('/api/strava/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          clubId: club.id,
          clubName: club.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowClubs(false);
        // Show sync result from initial sync
        if (data.syncResult) {
          setSyncResult(data.syncResult);
        }
        await loadStatus();
      } else {
        setError(data.error || 'Failed to select club');
      }
    } catch {
      setError('Failed to select club');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/strava/sync/${chapterId}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setSyncResult(data);
        await loadStatus();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch {
      setError('Failed to sync events');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        'Are you sure you want to disconnect Strava? Synced rides will remain but will no longer be updated.'
      )
    ) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/strava/disconnect?chapterId=${chapterId}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        setStatus({ connected: false });
        setShowClubs(false);
        setClubs([]);
        setSyncResult(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch {
      setError('Failed to disconnect Strava');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleAutoSyncToggle = async () => {
    if (!status) return;

    try {
      const res = await fetch(`/api/strava/sync/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSync: !status.autoSync }),
      });

      if (res.ok) {
        setStatus({ ...status, autoSync: !status.autoSync });
      }
    } catch {
      console.error('Failed to toggle auto-sync');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Loading Strava status...
        </span>
      </div>
    );
  }

  // Not connected - show connect button
  if (!status?.connected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Strava account to automatically sync club events to your
          chapter&apos;s rides.
        </p>
        <StravaConnectButton chapterId={chapterId} />
      </div>
    );
  }

  // Connected but selecting club
  if (showClubs) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select a Strava club to sync events from:
        </p>

        {isSyncing ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Connecting and syncing events...
            </span>
          </div>
        ) : isLoadingClubs ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading your Strava clubs...
            </span>
          </div>
        ) : clubs.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No Strava clubs found. Make sure you&apos;re a member of at least
              one club on Strava.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {clubs.map((club) => (
              <Card
                key={club.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => selectClub(club)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  {club.profileMedium ? (
                    <img
                      src={club.profileMedium}
                      alt={club.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <StravaIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{club.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[club.city, club.state, club.country]
                        .filter(Boolean)
                        .join(', ')}{' '}
                      · {club.memberCount} members
                    </p>
                  </div>
                  {club.isAdmin && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {status.clubId && (
          <Button variant="outline" onClick={() => setShowClubs(false)}>
            Cancel
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Connected with club selected - show sync controls
  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <div className="h-10 w-10 rounded-lg bg-[#FC4C02]/10 flex items-center justify-center">
          <StravaIcon className="h-5 w-5 text-[#FC4C02]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{status.clubName || 'Strava Club'}</p>
          <p className="text-sm text-muted-foreground">
            {status.syncedRideCount || 0} synced rides
          </p>
        </div>
        <a
          href={`https://www.strava.com/clubs/${status.clubId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Last sync info */}
      {status.lastSyncAt && (
        <p className="text-sm text-muted-foreground">
          Last synced{' '}
          {formatDistanceToNow(new Date(status.lastSyncAt), {
            addSuffix: true,
          })}
          {status.connectedBy && ` by ${status.connectedBy}`}
        </p>
      )}

      {/* Sync error */}
      {status.lastSyncError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Last sync error: {status.lastSyncError}
          </AlertDescription>
        </Alert>
      )}

      {/* Sync result */}
      {syncResult && (
        <Alert
          variant={syncResult.success ? 'default' : 'destructive'}
          className={
            syncResult.success
              ? 'border-green-500 bg-green-50 dark:bg-green-950'
              : ''
          }
        >
          {syncResult.success ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {syncResult.success ? (
              <span className="text-green-600">
                Sync complete: {syncResult.created} created,{' '}
                {syncResult.updated} updated, {syncResult.skipped} skipped
              </span>
            ) : (
              <span>
                Sync failed: {syncResult.errors.join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Auto-sync toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Auto-sync</Label>
          <p className="text-xs text-muted-foreground">
            Automatically sync new events (coming soon)
          </p>
        </div>
        <Button
          variant={status.autoSync ? 'default' : 'outline'}
          size="sm"
          onClick={handleAutoSyncToggle}
          disabled // Auto-sync not implemented yet
        >
          {status.autoSync ? 'Enabled' : 'Disabled'}
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Now
        </Button>
        <Button variant="outline" onClick={() => setShowClubs(true)}>
          Change Club
        </Button>
        <Button
          variant="ghost"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="text-destructive hover:text-destructive"
        >
          {isDisconnecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Unlink className="h-4 w-4 mr-2" />
          )}
          Disconnect
        </Button>
      </div>

      {/* Manual create fallback */}
      {createRideUrl && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Strava sync not working? Some events may have outdated data in Strava&apos;s API.
          </p>
          <Button variant="outline" asChild>
            <Link href={createRideUrl}>
              <Plus className="h-4 w-4 mr-2" />
              Create ride manually
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
