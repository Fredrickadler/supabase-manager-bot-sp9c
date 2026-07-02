import { createBot } from './bot/bot';
import { logger } from './utils/logger';

async function main() {
  const bot = createBot();

  // In local/VPS+PM2 mode we use long polling. On Vercel, use api/webhook.ts instead.
  await bot.telegram.deleteWebhook().catch(() => {});
  await bot.launch();
  logger.info('🤖 Bot started with long polling');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
