import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications/settings - Get user's notification preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create notification settings for user
    let settings = await prisma.userNotificationSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.userNotificationSettings.create({
        data: {
          userId: session.user.id,
          pushEnabled: true,
          newRideNotifications: true,
          rideUpdateNotifications: true,
          rideReminderNotifications: true,
          commentNotifications: true,
          autoFollowOnRsvp: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('GET /api/notifications/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/settings - Update user's notification preferences
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pushEnabled,
      newRideNotifications,
      rideUpdateNotifications,
      rideReminderNotifications,
      commentNotifications,
      autoFollowOnRsvp,
    } = body;

    // Upsert notification settings
    const settings = await prisma.userNotificationSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(newRideNotifications !== undefined && { newRideNotifications }),
        ...(rideUpdateNotifications !== undefined && { rideUpdateNotifications }),
        ...(rideReminderNotifications !== undefined && { rideReminderNotifications }),
        ...(commentNotifications !== undefined && { commentNotifications }),
        ...(autoFollowOnRsvp !== undefined && { autoFollowOnRsvp }),
      },
      create: {
        userId: session.user.id,
        pushEnabled: pushEnabled ?? true,
        newRideNotifications: newRideNotifications ?? true,
        rideUpdateNotifications: rideUpdateNotifications ?? true,
        rideReminderNotifications: rideReminderNotifications ?? true,
        commentNotifications: commentNotifications ?? true,
        autoFollowOnRsvp: autoFollowOnRsvp ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('PUT /api/notifications/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
