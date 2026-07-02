import type { Telegraf } from 'telegraf';
import type { AppContext } from '../middlewares/auth.middleware';
import { mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';
import { CB } from '../../config/constants';
import { sessionRepository } from '../../repositories/session.repository';

const WELCOME = [
  '👋 به ربات مدیریت Supabase خوش آمدید!',
  '',
  'با این ربات می‌توانید حساب‌های Supabase خود را متصل کرده و پروژه‌ها، دیتابیس، Storage، Auth و Edge Functions را مستقیماً از داخل تلگرام مدیریت کنید.',
  '',
  'برای شروع یکی از گزینه‌های زیر را انتخاب کنید 👇',
].join('\n');

export function registerStartHandlers(bot: Telegraf<AppContext>) {
  bot.start(async (ctx) => {
    if (ctx.state.user) await sessionRepository.clear(ctx.state.user.id);
    await ctx.reply(WELCOME, mainMenuKeyboard(Boolean(ctx.state.isAdmin)));
  });

  bot.action(CB.HOME, async (ctx) => {
    await ctx.answerCbQuery();
    if (ctx.state.user) await sessionRepository.clear(ctx.state.user.id);
    await ctx.editMessageText(WELCOME, mainMenuKeyboard(Boolean(ctx.state.isAdmin))).catch(() =>
      ctx.reply(WELCOME, mainMenuKeyboard(Boolean(ctx.state.isAdmin))),
    );
  });

  bot.action(CB.CANCEL, async (ctx) => {
    await ctx.answerCbQuery('لغو شد');
    if (ctx.state.user) await sessionRepository.clear(ctx.state.user.id);
    await ctx.editMessageText(WELCOME, mainMenuKeyboard(Boolean(ctx.state.isAdmin))).catch(() =>
      ctx.reply(WELCOME, mainMenuKeyboard(Boolean(ctx.state.isAdmin))),
    );
  });

  bot.action(CB.NOOP, async (ctx) => ctx.answerCbQuery());

  bot.help(async (ctx) => {
    await ctx.reply(
      [
        'راهنما:',
        '/start — نمایش منوی اصلی',
        '🔑 اکانت‌های Supabase — مدیریت اکانت‌های متصل‌شده',
        '➕ افزودن اکانت جدید — اتصال یک Personal Access Token جدید',
        'در هر مرحله می‌توانید با دکمه‌های ⬅️ بازگشت و 🏠 خانه پیمایش کنید.',
      ].join('\n'),
    );
  });
}
