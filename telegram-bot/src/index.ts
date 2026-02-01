import { createServer } from 'http';
import { config, validateConfig } from './config.js';
import { bot, startPolling, setupWebhook, getWebhookCallback } from './bot/bot.js';

async function main() {
  // Validate configuration
  validateConfig();

  if (config.isDev) {
    // Development: use long-polling
    console.log('Running in development mode');
    await startPolling();
  } else {
    // Production: use webhooks
    console.log('Running in production mode');

    if (!config.webhookUrl) {
      throw new Error('WEBHOOK_URL is required in production');
    }

    // Set up webhook
    await setupWebhook(`${config.webhookUrl}/webhook`);

    // Create simple HTTP server for webhooks
    const server = createServer(async (req, res) => {
      // Health check endpoint
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', bot: 'running' }));
        return;
      }

      // Webhook endpoint
      if (req.url === '/webhook' && req.method === 'POST') {
        try {
          // Read request body
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = Buffer.concat(chunks).toString();
          const update = JSON.parse(body);

          // Process update
          await bot.handleUpdate(update);

          res.writeHead(200);
          res.end();
        } catch (error) {
          console.error('Webhook error:', error);
          res.writeHead(500);
          res.end();
        }
        return;
      }

      // 404 for other routes
      res.writeHead(404);
      res.end('Not Found');
    });

    server.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
      console.log(`Webhook URL: ${config.webhookUrl}/webhook`);
      console.log(`Health check: http://localhost:${config.port}/health`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  bot.stop();
  process.exit(0);
});

// Start the bot
main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
