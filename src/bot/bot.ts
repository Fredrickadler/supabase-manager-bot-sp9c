import { Telegraf } from 'telegraf';
import { env } from '../config/env';
import type { AppContext } from './middlewares/auth.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { rateLimitMiddleware } from './middlewares/rateLimit.middleware';
import { registerStartHandlers } from './handlers/start.handler';
import { registerAccountsHandlers } from './handlers/accounts.handler';
import { registerProjectsHandlers } from './handlers/projects.handler';
import { registerSqlEditorHandlers } from './handlers/sqlEditor.handler';
import { registerAdminHandlers } from './handlers/admin.handler';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { logger } from '../utils/logger';

export function createBot(): Telegraf<AppContext> {
  const bot = new Telegraf<AppContext>(env.BOT_TOKEN);

  bot.use((ctx, next) => {
    (ctx as AppContext).state = {};
    return next();
  });

  bot.use(rateLimitMiddleware);
  bot.use(authMiddleware);

  registerStartHandlers(bot);
  registerAccountsHandlers(bot);
  registerProjectsHandlers(bot);
  registerSqlEditorHandlers(bot);
  registerAdminHandlers(bot);

  // Fallback for unmatched text (no active session, no command match)
  bot.on('text', async (ctx) => {
    await ctx.reply('متوجه نشدم 🤔 برای مشاهده منو /start را بزنید.');
  });

  bot.catch(async (err, ctx) => {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled bot error', { error: message, updateType: ctx.updateType });
    await auditLogRepository
      .log({
        userId: (ctx as AppContext).state?.user?.id,
        action: 'bot.error',
        metadata: { message },
        isError: true,
      })
      .catch(() => {});
    try {
      await ctx.reply('⚠️ خطای غیرمنتظره‌ای رخ داد. تیم فنی مطلع شد.');
    } catch {
      /* swallow secondary failure */
    }
  });

  return bot;
}
