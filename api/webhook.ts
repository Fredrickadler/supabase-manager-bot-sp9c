import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBot } from '../src/bot/bot';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';

// Reuse a single bot instance across warm invocations
let botInstance: ReturnType<typeof createBot> | null = null;
function getBot() {
  if (!botInstance) botInstance = createBot();
  return botInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Protect the endpoint with a secret path/query so only Telegram (who knows it) can reach it
  const secret = req.query.secret;
  if (secret !== env.WEBHOOK_SECRET) {
    res.status(401).json({ ok: false });
    return;
  }

  if (req.method !== 'POST') {
    res.status(200).json({ ok: true, message: 'Webhook is alive' });
    return;
  }

  try {
    const bot = getBot();
    await bot.handleUpdate(req.body, res);
  } catch (err) {
    logger.error('webhook handler error', { error: (err as Error).message });
    if (!res.headersSent) res.status(500).json({ ok: false });
  }
}
