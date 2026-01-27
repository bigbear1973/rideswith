import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// Initialize web-push with VAPID keys (set these in environment variables)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@rideswith.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: NotificationPayload
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notification');
    return { success: false, reason: 'VAPID keys not configured' };
  }

  // Check user's notification settings
  const settings = await prisma.userNotificationSettings.findUnique({
    where: { userId },
  });

  if (settings && !settings.pushEnabled) {
    return { success: false, reason: 'User has disabled push notifications' };
  }

  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { success: false, reason: 'No push subscriptions found' };
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            ...payload,
            icon: payload.icon || '/icon-192.png',
            badge: payload.badge || '/icon-192.png',
          })
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (error: unknown) {
        // If subscription is invalid, remove it
        const webPushError = error as { statusCode?: number };
        if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          }).catch(() => {});
        }
        throw error;
      }
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return {
    success: successful > 0,
    sent: successful,
    failed,
  };
}

/**
 * Send push notification to all followers of a chapter
 */
export async function sendPushToChapterFollowers(
  chapterId: string,
  payload: NotificationPayload,
  excludeUserId?: string
) {
  const followers = await prisma.follow.findMany({
    where: { chapterId },
    select: { userId: true },
  });

  const results = await Promise.allSettled(
    followers
      .filter((f) => f.userId !== excludeUserId)
      .map((f) => sendPushToUser(f.userId, payload))
  );

  return {
    total: followers.length,
    successful: results.filter((r) => r.status === 'fulfilled').length,
  };
}

/**
 * Send push notification to all followers of a brand/community
 */
export async function sendPushToBrandFollowers(
  brandId: string,
  payload: NotificationPayload,
  excludeUserId?: string
) {
  const followers = await prisma.follow.findMany({
    where: { brandId },
    select: { userId: true },
  });

  const results = await Promise.allSettled(
    followers
      .filter((f) => f.userId !== excludeUserId)
      .map((f) => sendPushToUser(f.userId, payload))
  );

  return {
    total: followers.length,
    successful: results.filter((r) => r.status === 'fulfilled').length,
  };
}

/**
 * Notify users about a new ride in a chapter they follow
 */
export async function notifyNewRide(
  ride: {
    id: string;
    title: string;
    date: Date;
    chapterId: string | null;
  },
  creatorId: string
) {
  if (!ride.chapterId) return;

  const chapter = await prisma.chapter.findUnique({
    where: { id: ride.chapterId },
    include: { brand: { select: { name: true } } },
  });

  if (!chapter) return;

  // Get all followers who have newRideNotifications enabled
  const followers = await prisma.follow.findMany({
    where: { chapterId: ride.chapterId },
    include: {
      user: {
        include: {
          notificationSettings: true,
        },
      },
    },
  });

  const dateStr = new Date(ride.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const payload: NotificationPayload = {
    title: `New Ride: ${ride.title}`,
    body: `${chapter.brand.name} ${chapter.name} - ${dateStr}`,
    url: `/rides/${ride.id}`,
    tag: `new-ride-${ride.id}`,
  };

  const eligibleFollowers = followers.filter(
    (f) =>
      f.userId !== creatorId &&
      (f.user.notificationSettings?.newRideNotifications !== false)
  );

  await Promise.allSettled(
    eligibleFollowers.map((f) => sendPushToUser(f.userId, payload))
  );
}

/**
 * Notify users about a ride update (time, location change)
 */
export async function notifyRideUpdate(
  ride: {
    id: string;
    title: string;
    date: Date;
  },
  changeType: 'time' | 'location' | 'cancelled',
  organizerId: string
) {
  // Get all users who RSVPed to this ride
  const rsvps = await prisma.rsvp.findMany({
    where: {
      rideId: ride.id,
      status: { in: ['GOING', 'MAYBE'] },
    },
    include: {
      user: {
        include: {
          notificationSettings: true,
        },
      },
    },
  });

  const messages = {
    time: 'Time has been updated',
    location: 'Location has been updated',
    cancelled: 'This ride has been cancelled',
  };

  const payload: NotificationPayload = {
    title: `Ride Update: ${ride.title}`,
    body: messages[changeType],
    url: `/rides/${ride.id}`,
    tag: `ride-update-${ride.id}`,
  };

  const eligibleUsers = rsvps.filter(
    (r) =>
      r.userId !== organizerId &&
      (r.user.notificationSettings?.rideUpdateNotifications !== false)
  );

  await Promise.allSettled(
    eligibleUsers.map((r) => sendPushToUser(r.userId, payload))
  );
}

/**
 * Generate VAPID keys (run once to get keys for env vars)
 * Call this function manually if you need new keys:
 * node -e "console.log(require('web-push').generateVAPIDKeys())"
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
