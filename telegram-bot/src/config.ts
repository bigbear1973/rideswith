import 'dotenv/config';

export const config = {
  // Telegram
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',

  // Groq API for fast LLM inference
  groqApiKey: process.env.GROQ_API_KEY || '',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // RidesWith API
  ridesWithApiUrl: process.env.RIDESWITH_API_URL || 'https://rideswith.com/api',
  ridesWithBaseUrl: process.env.RIDESWITH_BASE_URL || 'https://rideswith.com',

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Webhook (production)
  webhookUrl: process.env.WEBHOOK_URL,
  port: parseInt(process.env.PORT || '3000', 10),
};

// Validate required config
export function validateConfig(): void {
  const required = ['telegramToken', 'groqApiKey', 'databaseUrl'] as const;

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
}
