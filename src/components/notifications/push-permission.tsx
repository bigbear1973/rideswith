'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';

interface PushPermissionProps {
  className?: string;
}

export function PushPermissionBanner({ className }: PushPermissionProps) {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only show if:
    // 1. User is logged in
    // 2. Push is supported
    // 3. Permission hasn't been requested yet
    // 4. User hasn't dismissed this banner recently
    if (!session) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;

    // Check if user dismissed the banner recently (24 hours)
    const dismissed = localStorage.getItem('push-banner-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (dismissedAt > oneDayAgo) return;
    }

    setShow(true);
  }, [session]);

  const handleEnable = async () => {
    setIsLoading(true);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Get VAPID public key
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error('VAPID key not configured');
          setShow(false);
          return;
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });

        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
      }

      setShow(false);
    } catch (error) {
      console.error('Push subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-banner-dismissed', Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <Card className={className}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">Stay updated on new rides</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Get notified when new rides are added to communities you follow.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleEnable} disabled={isLoading}>
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for inline use
export function PushPermissionButton() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;

    setShow(true);
  }, [session]);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
          });

          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription.toJSON()),
          });
        }
      }

      setShow(false);
    } catch (error) {
      console.error('Push subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-2"
    >
      <Bell className="h-4 w-4" />
      {isLoading ? 'Enabling...' : 'Enable Notifications'}
    </Button>
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
