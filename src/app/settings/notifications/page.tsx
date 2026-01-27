'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  ChevronLeft,
  Loader2,
  Calendar,
  MessageSquare,
  Clock,
  Users,
} from 'lucide-react';

interface NotificationSettings {
  id: string;
  pushEnabled: boolean;
  newRideNotifications: boolean;
  rideUpdateNotifications: boolean;
  rideReminderNotifications: boolean;
  commentNotifications: boolean;
  autoFollowOnRsvp: boolean;
}

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check push notification support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);

      // Check if already subscribed
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/notifications/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        } else {
          setError('Failed to load notification settings');
        }
      } catch {
        setError('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'authenticated') {
      loadSettings();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/settings/notifications');
    }
  }, [status, router]);

  // Update a setting
  const updateSetting = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);

    // Optimistic update
    setSettings({ ...settings, [key]: value });

    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!res.ok) {
        // Revert on error
        setSettings({ ...settings, [key]: !value });
        setError('Failed to save setting');
      }
    } catch {
      // Revert on error
      setSettings({ ...settings, [key]: !value });
      setError('Failed to save setting');
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!pushSupported) return;

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        setError('Push notifications permission was denied');
        return;
      }

      // Get VAPID public key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError('Push notifications are not configured');
        return;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // Send subscription to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (res.ok) {
        setIsSubscribed(true);
        updateSetting('pushEnabled', true);
      } else {
        setError('Failed to save push subscription');
      }
    } catch (err) {
      console.error('Push subscription error:', err);
      setError('Failed to subscribe to push notifications');
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE',
        });
      }

      setIsSubscribed(false);
      updateSetting('pushEnabled', false);
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      setError('Failed to unsubscribe from push notifications');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Notification Settings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Push Notifications Enable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings?.pushEnabled && isSubscribed ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5" />
              )}
              Push Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications about rides you follow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!pushSupported ? (
              <Alert>
                <AlertDescription>
                  Push notifications are not supported in this browser. Try using a modern browser like Chrome, Firefox, or Safari.
                </AlertDescription>
              </Alert>
            ) : pushPermission === 'denied' ? (
              <Alert>
                <AlertDescription>
                  Push notifications are blocked. Please enable them in your browser settings to receive ride updates.
                </AlertDescription>
              </Alert>
            ) : isSubscribed ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications enabled</p>
                  <p className="text-sm text-muted-foreground">
                    You will receive push notifications
                  </p>
                </div>
                <Button variant="outline" onClick={unsubscribeFromPush}>
                  Disable
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications disabled</p>
                  <p className="text-sm text-muted-foreground">
                    Enable to get notified about new rides
                  </p>
                </div>
                <Button onClick={subscribeToPush}>
                  Enable Notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose what you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="new-rides" className="font-medium">
                      New Rides
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When new rides are added to communities you follow
                    </p>
                  </div>
                </div>
                <Switch
                  id="new-rides"
                  checked={settings.newRideNotifications}
                  onCheckedChange={(checked: boolean) =>
                    updateSetting('newRideNotifications', checked)
                  }
                  disabled={isSaving || !isSubscribed}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="ride-updates" className="font-medium">
                      Ride Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Changes to rides you RSVPed to (time, location, cancellation)
                    </p>
                  </div>
                </div>
                <Switch
                  id="ride-updates"
                  checked={settings.rideUpdateNotifications}
                  onCheckedChange={(checked: boolean) =>
                    updateSetting('rideUpdateNotifications', checked)
                  }
                  disabled={isSaving || !isSubscribed}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="ride-reminders" className="font-medium">
                      Ride Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Reminders before rides you RSVPed to
                    </p>
                  </div>
                </div>
                <Switch
                  id="ride-reminders"
                  checked={settings.rideReminderNotifications}
                  onCheckedChange={(checked: boolean) =>
                    updateSetting('rideReminderNotifications', checked)
                  }
                  disabled={isSaving || !isSubscribed}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="comments" className="font-medium">
                      Comments
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Replies to your comments
                    </p>
                  </div>
                </div>
                <Switch
                  id="comments"
                  checked={settings.commentNotifications}
                  onCheckedChange={(checked: boolean) =>
                    updateSetting('commentNotifications', checked)
                  }
                  disabled={isSaving || !isSubscribed}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-Follow Settings */}
        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Follow Settings
              </CardTitle>
              <CardDescription>
                Control automatic following behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-follow" className="font-medium">
                    Auto-follow on RSVP
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically follow a chapter when you RSVP to one of their rides
                  </p>
                </div>
                <Switch
                  id="auto-follow"
                  checked={settings.autoFollowOnRsvp}
                  onCheckedChange={(checked: boolean) =>
                    updateSetting('autoFollowOnRsvp', checked)
                  }
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {isSaving ? 'Saving...' : 'Settings are saved automatically'}
        </p>
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
