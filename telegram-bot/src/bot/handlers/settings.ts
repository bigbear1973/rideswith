import { Context } from 'grammy';
import { prisma } from '../../db/prisma.js';

export async function handleSettings(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('Sorry, I could not identify your Telegram account.');
    return;
  }

  // Get user settings
  const user = await prisma.telegramUser.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) {
    await ctx.reply('Please use /start first to set up your account.');
    return;
  }

  const locationStatus = user.defaultCity
    ? `📍 ${user.defaultCity}`
    : '📍 Not set';

  const settingsMessage = `
⚙️ <b>Your Settings</b>

<b>Location:</b> ${locationStatus}
<b>Search Radius:</b> ${user.defaultRadius} km
<b>Units:</b> ${user.unitPreference === 'km' ? 'Kilometers' : 'Miles'}

<b>To update your location:</b>
Share your location using the 📎 attachment button

<b>To change radius:</b>
Reply with: radius 25 (or any number in km)

<b>To change units:</b>
Reply with: units km (or: units mi)
`;

  await ctx.reply(settingsMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        [{ text: '📍 Update Location', request_location: true }],
        [{ text: '🔙 Back' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

/**
 * Handle settings updates from text messages
 */
export async function handleSettingsUpdate(ctx: Context): Promise<boolean> {
  const text = ctx.message?.text?.toLowerCase().trim();
  const telegramId = ctx.from?.id;

  if (!text || !telegramId) return false;

  // Check for radius update
  const radiusMatch = text.match(/^radius\s+(\d+)$/);
  if (radiusMatch) {
    const radius = parseInt(radiusMatch[1], 10);
    if (radius < 5 || radius > 500) {
      await ctx.reply('Please specify a radius between 5 and 500 km.');
      return true;
    }

    await prisma.telegramUser.update({
      where: { telegramId: BigInt(telegramId) },
      data: { defaultRadius: radius },
    });

    await ctx.reply(`✅ Search radius updated to ${radius} km`);
    return true;
  }

  // Check for units update
  const unitsMatch = text.match(/^units\s+(km|mi)$/);
  if (unitsMatch) {
    const unit = unitsMatch[1];
    await prisma.telegramUser.update({
      where: { telegramId: BigInt(telegramId) },
      data: { unitPreference: unit },
    });

    await ctx.reply(`✅ Units updated to ${unit === 'km' ? 'kilometers' : 'miles'}`);
    return true;
  }

  return false;
}

/**
 * Handle location shared by user
 */
export async function handleLocation(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  const location = ctx.message?.location;

  if (!telegramId || !location) {
    await ctx.reply('Sorry, I could not process your location.');
    return;
  }

  // Reverse geocode to get city name
  const { reverseGeocode } = await import('../../services/geocoding.js');
  const geocoded = await reverseGeocode(location.latitude, location.longitude);

  const cityName = geocoded?.city || 'your location';

  // Update user preferences
  await prisma.telegramUser.upsert({
    where: { telegramId: BigInt(telegramId) },
    create: {
      telegramId: BigInt(telegramId),
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      defaultLatitude: location.latitude,
      defaultLongitude: location.longitude,
      defaultCity: cityName,
    },
    update: {
      defaultLatitude: location.latitude,
      defaultLongitude: location.longitude,
      defaultCity: cityName,
    },
  });

  await ctx.reply(
    `📍 Location saved! I'll use ${cityName} for your searches.\n\nTry /nearby to see rides near you.`,
    {
      reply_markup: {
        keyboard: [
          [{ text: '🚴 Nearby Rides' }, { text: '🔍 Search' }],
        ],
        resize_keyboard: true,
      },
    }
  );
}
