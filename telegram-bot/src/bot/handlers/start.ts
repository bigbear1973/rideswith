import { Context } from 'grammy';
import { prisma } from '../../db/prisma.js';

export async function handleStart(ctx: Context): Promise<void> {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;

  if (!telegramId) {
    await ctx.reply('Sorry, I could not identify your Telegram account.');
    return;
  }

  // Try to create or update telegram user (gracefully handle DB errors)
  try {
    await prisma.telegramUser.upsert({
      where: { telegramId: BigInt(telegramId) },
      create: {
        telegramId: BigInt(telegramId),
        username,
        firstName,
      },
      update: {
        username,
        firstName,
      },
    });
  } catch (error) {
    console.log('Database not available, continuing without persistence');
  }

  const welcomeMessage = `
🚴 <b>Welcome to RidesWith!</b>

I help you discover group cycling rides near you.

<b>How to search:</b>
• Just type naturally: "rides near Berlin this weekend"
• Or use commands like /nearby for quick searches

<b>Commands:</b>
/rides [query] - Search for rides
/nearby - Rides near your saved location
/settings - Update your preferences
/help - Show this help message

<b>To get started:</b>
Share your location using the 📎 attachment button, and I'll remember it for future searches!

Or just tell me what you're looking for, like:
• "group rides in Munich"
• "gravel rides this weekend"
• "fast rides near me"
`;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        [{ text: '📍 Share Location', request_location: true }],
        [{ text: '🚴 Nearby Rides' }, { text: '🔍 Search' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  });
}
