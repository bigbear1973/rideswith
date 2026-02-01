import { Context } from 'grammy';
import { handleSettingsUpdate } from './settings.js';
import { handleRides } from './rides.js';
import { handleNearby } from './nearby.js';

/**
 * Handle general text messages (natural language queries)
 */
export async function handleMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text?.trim();

  if (!text) return;

  // Handle keyboard button presses
  if (text === '🚴 Nearby Rides') {
    return handleNearby(ctx);
  }

  if (text === '🔍 Search') {
    await ctx.reply(
      '🔍 <b>Search for rides</b>\n\nJust type what you\'re looking for:\n• "rides near Berlin"\n• "gravel rides this weekend"\n• "fast rides tomorrow"',
      { parse_mode: 'HTML' }
    );
    return;
  }

  if (text === '🔙 Back') {
    await ctx.reply('What would you like to do?', {
      reply_markup: {
        keyboard: [
          [{ text: '🚴 Nearby Rides' }, { text: '🔍 Search' }],
        ],
        resize_keyboard: true,
      },
    });
    return;
  }

  // Check for settings update commands
  const isSettingsUpdate = await handleSettingsUpdate(ctx);
  if (isSettingsUpdate) return;

  // Treat as a natural language search query
  await handleRides(ctx);
}
