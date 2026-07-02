import type { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import type { AppContext } from '../middlewares/auth.middleware';
import { CB } from '../../config/constants';
import { adminService } from '../../services/admin.service';
import { sessionRepository } from '../../repositories/session.repository';
import { userRepository } from '../../repositories/user.repository';
import { backHomeRow } from '../keyboards/mainMenu.keyboard';

function adminMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📊 آمار', CB.ADMIN_STATS)],
    [Markup.button.callback('📢 پیام همگانی', CB.ADMIN_BROADCAST)],
    [Markup.button.callback('🚫 بلاک کاربر', CB.ADMIN_BLOCK)],
    [Markup.button.callback('🐞 خطاهای اخیر', CB.ADMIN_ERRORS)],
    backHomeRow(),
  ]);
}

function requireAdmin(ctx: AppContext): boolean {
  return Boolean(ctx.state.isAdmin);
}

export function registerAdminHandlers(bot: Telegraf<AppContext>) {
  bot.action(CB.ADMIN_HOME, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireAdmin(ctx)) return ctx.reply('⛔️ شما دسترسی ادمین ندارید.');
    await ctx.editMessageText('🛠 پنل ادمین', adminMenu()).catch(() => ctx.reply('🛠 پنل ادمین', adminMenu()));
  });

  bot.action(CB.ADMIN_STATS, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireAdmin(ctx)) return;
    const stats = await adminService.getStats();
    await ctx.reply(
      [
        '📊 آمار ربات:',
        `👥 تعداد کاربران: ${stats.users}`,
        `🔑 تعداد اکانت‌های متصل: ${stats.accounts}`,
        `📈 تعداد درخواست‌های ثبت‌شده: ${stats.requests}`,
      ].join('\n'),
    );
  });

  bot.action(CB.ADMIN_ERRORS, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireAdmin(ctx)) return;
    const errors = await adminService.recentErrors(10);
    if (errors.length === 0) return ctx.reply('✅ خطایی ثبت نشده است.');
    const text = errors
      .map((e) => `• [${e.createdAt.toLocaleString('fa-IR')}] ${e.action}`)
      .join('\n');
    await ctx.reply(`🐞 آخرین خطاها:\n${text}`);
  });

  bot.action(CB.ADMIN_BROADCAST, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireAdmin(ctx)) return;
    await sessionRepository.set(ctx.state.user!.id, 'admin_broadcast', {});
    await ctx.reply('📢 متن پیام همگانی را ارسال کنید:');
  });

  bot.action(CB.ADMIN_BLOCK, async (ctx) => {
    await ctx.answerCbQuery();
    if (!requireAdmin(ctx)) return;
    await sessionRepository.set(ctx.state.user!.id, 'admin_block', {});
    await ctx.reply('🚫 آیدی عددی تلگرام کاربر مورد نظر برای بلاک/آنبلاک را ارسال کنید:');
  });

  bot.on('text', async (ctx, next) => {
    if (!requireAdmin(ctx)) return next();
    const session = await sessionRepository.get(ctx.state.user!.id);
    if (!session?.step?.startsWith('admin_')) return next();

    if (session.step === 'admin_broadcast') {
      await sessionRepository.clear(ctx.state.user!.id);
      await ctx.reply('⏳ در حال ارسال پیام همگانی...');
      const result = await adminService.broadcast(bot, ctx.message.text);
      await ctx.reply(`✅ ارسال شد به ${result.sent} کاربر. ناموفق: ${result.failed}`);
      return;
    }

    if (session.step === 'admin_block') {
      await sessionRepository.clear(ctx.state.user!.id);
      const telegramId = ctx.message.text.trim();
      if (!/^\d+$/.test(telegramId)) return ctx.reply('❌ آیدی نامعتبر است.');
      const targetUser = await userRepository.findByTelegramId(BigInt(telegramId));
      if (!targetUser) return ctx.reply('❌ کاربری با این آیدی یافت نشد.');
      const updated = await adminService.blockUser(targetUser.id, !targetUser.isBlocked);
      await ctx.reply(updated.isBlocked ? '🚫 کاربر بلاک شد.' : '✅ کاربر آنبلاک شد.');
      return;
    }

    return next();
  });
}
