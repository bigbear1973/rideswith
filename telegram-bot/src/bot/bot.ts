import { Bot, webhookCallback } from 'grammy';
import { config } from '../config.js';

// Import handlers
import { handleStart } from './handlers/start.js';
import { handleHelp } from './handlers/help.js';
import { handleSettings, handleLocation } from './handlers/settings.js';
import { handleNearby } from './handlers/nearby.js';
import { handleRides } from './handlers/rides.js';
import { handleMessage } from './handlers/message.js';

// Create bot instance
export const bot = new Bot(config.telegramToken);

// Register command handlers
bot.command('start', handleStart);
bot.command('help', handleHelp);
bot.command('settings', handleSettings);
bot.command('nearby', handleNearby);
bot.command('rides', handleRides);

// Handle location messages
bot.on('message:location', handleLocation);

// Handle all other text messages (natural language queries)
bot.on('message:text', handleMessage);

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

/**
 * Start the bot with long-polling (development)
 */
export async function startPolling(): Promise<void> {
  // Delete any existing webhook first
  await bot.api.deleteWebhook();

  console.log('Starting bot with long-polling...');
  await bot.start({
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} started!`);
    },
  });
}

/**
 * Get webhook callback handler (production)
 */
export function getWebhookCallback() {
  return webhookCallback(bot, 'express');
}

/**
 * Set up webhook for production
 */
export async function setupWebhook(url: string): Promise<void> {
  await bot.api.setWebhook(url);
  console.log(`Webhook set to: ${url}`);
}
