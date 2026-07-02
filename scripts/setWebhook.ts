/**
 * Run once after deploying to Vercel:
 *   npx tsx scripts/setWebhook.ts
 *
 * Reads BOT_TOKEN, WEBHOOK_URL and WEBHOOK_SECRET from .env
 */
import 'dotenv/config';
import axios from 'axios';

async function main() {
  const { BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET } = process.env;
  if (!BOT_TOKEN || !WEBHOOK_URL || !WEBHOOK_SECRET) {
    console.error('BOT_TOKEN, WEBHOOK_URL and WEBHOOK_SECRET must be set in .env');
    process.exit(1);
  }

  const url = `${WEBHOOK_URL.replace(/\/$/, '')}/api/webhook?secret=${WEBHOOK_SECRET}`;
  const res = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, { url });
  console.log(res.data);
}

main();
