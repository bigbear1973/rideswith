import { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { prisma } from '../../db/prisma.js';
import { searchRides, getRideUrl } from '../../services/rideswith-api.js';
import { formatRideList } from '../../utils/format.js';

export async function handleNearby(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('Sorry, I could not identify your Telegram account.');
    return;
  }

  // Get user's saved location
  const user = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user?.defaultLatitude || !user?.defaultLongitude) {
    await ctx.reply(
      "📍 I don't have your location yet!\n\nPlease share your location using the button below or the 📎 attachment menu.",
      {
        reply_markup: {
          keyboard: [[{ text: '📍 Share Location', request_location: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
    return;
  }

  // Show loading message
  const loadingMsg = await ctx.reply('🔍 Searching for rides near you...');

  try {
    // Search for rides near user's location
    const rides = await searchRides({
      lat: user.defaultLatitude,
      lng: user.defaultLongitude,
      radius: user.defaultRadius,
      limit: 5,
    });

    // Delete loading message
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});

    // Format and send results
    const message = formatRideList(
      rides,
      user.defaultCity || undefined,
      user.defaultLatitude,
      user.defaultLongitude
    );

    // Build inline keyboard with View buttons for each ride
    const keyboard = new InlineKeyboard();
    rides.slice(0, 5).forEach((ride, index) => {
      if (index > 0) keyboard.row();
      keyboard.url(`View: ${ride.title.substring(0, 20)}...`, getRideUrl(ride.id));
    });

    if (rides.length > 0) {
      keyboard.row().url('🌐 Browse all rides on RidesWith', 'https://rideswith.com/discover');
    }

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('Nearby search error:', error);
    await ctx.api.deleteMessage(ctx.chat!.id, loadingMsg.message_id).catch(() => {});
    await ctx.reply(
      'Sorry, something went wrong while searching for rides. Please try again later.'
    );
  }
}
