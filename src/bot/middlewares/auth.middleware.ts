import type { Context, MiddlewareFn } from 'telegraf';
import { userService } from '../../services/user.service';
import { logger } from '../../utils/logger';

export interface AppContext extends Context {
  state: {
    user?: Awaited<ReturnType<typeof userService.registerOrTouch>>;
    isAdmin?: boolean;
  };
}

export const authMiddleware: MiddlewareFn<AppContext> = async (ctx, next) => {
  const from = ctx.from;
  if (!from) return next();

  try {
    const user = await userService.registerOrTouch(from);

    if (user.isBlocked) {
      await ctx.reply('⛔️ دسترسی شما به این ربات مسدود شده است.');
      return;
    }

    ctx.state.user = user;
    ctx.state.isAdmin = userService.isAdmin(user);
    return next();
  } catch (err) {
    logger.error('auth.middleware error', { error: (err as Error).message });
    await ctx.reply('⚠️ خطایی در پردازش درخواست رخ داد. لطفاً دوباره تلاش کنید.');
  }
};
