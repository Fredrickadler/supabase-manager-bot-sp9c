import type { MiddlewareFn } from 'telegraf';
import type { AppContext } from './auth.middleware';
import { env } from '../../config/env';

// In-memory store — sufficient for a single serverless instance / small bot.
// For multi-instance deployments, swap for a Redis-backed limiter.
const hits = new Map<number, number[]>();

export const rateLimitMiddleware: MiddlewareFn<AppContext> = async (ctx, next) => {
  const id = ctx.from?.id;
  if (!id) return next();

  const now = Date.now();
  const windowStart = now - env.RATE_LIMIT_WINDOW_MS;
  const timestamps = (hits.get(id) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= env.RATE_LIMIT_MAX_REQUESTS) {
    await ctx.reply('⏳ درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید و دوباره تلاش کنید.');
    return;
  }

  timestamps.push(now);
  hits.set(id, timestamps);
  return next();
};
