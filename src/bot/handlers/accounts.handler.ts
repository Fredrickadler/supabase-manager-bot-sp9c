import type { Telegraf } from 'telegraf';
import type { AppContext } from '../middlewares/auth.middleware';
import { CB } from '../../config/constants';
import { accountService } from '../../services/account.service';
import { sessionRepository } from '../../repositories/session.repository';
import { accountLabelSchema, personalAccessTokenSchema } from '../../utils/validators';
import {
  accountsListKeyboard,
  accountDetailKeyboard,
  confirmDeleteKeyboard,
} from '../keyboards/accounts.keyboard';
import { logger } from '../../utils/logger';

export function registerAccountsHandlers(bot: Telegraf<AppContext>) {
  bot.action(CB.ACCOUNTS_LIST, async (ctx) => {
    await ctx.answerCbQuery();
    const accounts = await accountService.listAccounts(ctx.state.user!.id);
    if (accounts.length === 0) {
      await ctx.editMessageText(
        'هنوز هیچ اکانت Supabase متصل نکرده‌اید.\nبرای شروع، یک Personal Access Token اضافه کنید.',
        accountsListKeyboard([]),
      ).catch(() => {});
      return;
    }
    await ctx
      .editMessageText('🔑 اکانت‌های شما:', accountsListKeyboard(accounts))
      .catch(() => ctx.reply('🔑 اکانت‌های شما:', accountsListKeyboard(accounts)));
  });

  bot.action(CB.ACCOUNTS_ADD, async (ctx) => {
    await ctx.answerCbQuery();
    await sessionRepository.set(ctx.state.user!.id, 'awaiting_token', {});
    await ctx.reply(
      [
        '🔐 لطفاً Personal Access Token حساب Supabase خود را ارسال کنید.',
        '',
        'می‌توانید آن را از اینجا بسازید:',
        'https://supabase.com/dashboard/account/tokens',
        '',
        'برای لغو، دستور /start را بزنید.',
      ].join('\n'),
    );
  });

  bot.action(new RegExp(`^${CB.ACCOUNTS_VIEW}:(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const id = (ctx.match as RegExpMatchArray)[1];
    const account = await accountService.getAccount(id, ctx.state.user!.id);
    if (!account) return ctx.reply('اکانت یافت نشد.');
    await ctx
      .editMessageText(
        `🔑 اکانت: ${account.label}\n${account.isDefault ? '⭐ اکانت پیش‌فرض' : ''}`,
        accountDetailKeyboard(account),
      )
      .catch(() => ctx.reply(`🔑 اکانت: ${account.label}`, accountDetailKeyboard(account)));
  });

  bot.action(new RegExp(`^${CB.ACCOUNTS_RENAME}:(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const id = (ctx.match as RegExpMatchArray)[1];
    await sessionRepository.set(ctx.state.user!.id, 'awaiting_rename', { accountId: id });
    await ctx.reply('✏️ نام جدید اکانت را ارسال کنید:');
  });

  bot.action(new RegExp(`^${CB.ACCOUNTS_SET_DEFAULT}:(.+)$`), async (ctx) => {
    const id = (ctx.match as RegExpMatchArray)[1];
    await accountService.setDefault(id, ctx.state.user!.id);
    await ctx.answerCbQuery('✅ به‌عنوان اکانت پیش‌فرض تنظیم شد');
    const account = await accountService.getAccount(id, ctx.state.user!.id);
    if (account) {
      await ctx
        .editMessageText(`🔑 اکانت: ${account.label}\n⭐ اکانت پیش‌فرض`, accountDetailKeyboard(account))
        .catch(() => {});
    }
  });

  bot.action(new RegExp(`^${CB.ACCOUNTS_DELETE}:(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const id = (ctx.match as RegExpMatchArray)[1];
    await ctx.reply(
      '⚠️ آیا از حذف این اکانت مطمئن هستید؟ این عمل قابل بازگشت نیست.',
      confirmDeleteKeyboard(`${CB.ACCOUNTS_DELETE_CONFIRM}:${id}`, CB.CANCEL),
    );
  });

  bot.action(new RegExp(`^${CB.ACCOUNTS_DELETE_CONFIRM}:(.+)$`), async (ctx) => {
    const id = (ctx.match as RegExpMatchArray)[1];
    await accountService.deleteAccount(id, ctx.state.user!.id);
    await ctx.answerCbQuery('🗑 اکانت حذف شد');
    await ctx.editMessageText('✅ اکانت با موفقیت حذف شد.').catch(() => {});
  });

  // ----- Text message wizard steps -----
  bot.on('text', async (ctx, next) => {
    const session = await sessionRepository.get(ctx.state.user!.id);
    if (!session?.step) return next();

    if (session.step === 'awaiting_token') {
      const parsed = personalAccessTokenSchema.safeParse(ctx.message.text);
      if (!parsed.success) {
        await ctx.reply(`❌ ${parsed.error.errors[0]?.message}`);
        return;
      }
      await sessionRepository.set(ctx.state.user!.id, 'awaiting_label', { token: parsed.data });
      await ctx.reply('✏️ یک نام دلخواه برای این اکانت وارد کنید (مثلاً: اکانت شخصی):');
      return;
    }

    if (session.step === 'awaiting_label') {
      const parsed = accountLabelSchema.safeParse(ctx.message.text);
      if (!parsed.success) {
        await ctx.reply(`❌ ${parsed.error.errors[0]?.message}`);
        return;
      }
      const context = session.context as { token: string };
      await ctx.reply('⏳ در حال اعتبارسنجی توکن...');
      try {
        await accountService.addAccount(ctx.state.user!.id, parsed.data, context.token);
        await sessionRepository.clear(ctx.state.user!.id);
        await ctx.reply('✅ اکانت با موفقیت اضافه شد.');
      } catch (err) {
        logger.warn('account add failed', { error: (err as Error).message });
        await ctx.reply(`❌ ${(err as Error).message}`);
      }
      return;
    }

    if (session.step === 'awaiting_rename') {
      const parsed = accountLabelSchema.safeParse(ctx.message.text);
      if (!parsed.success) {
        await ctx.reply(`❌ ${parsed.error.errors[0]?.message}`);
        return;
      }
      const context = session.context as { accountId: string };
      await accountService.renameAccount(context.accountId, ctx.state.user!.id, parsed.data);
      await sessionRepository.clear(ctx.state.user!.id);
      await ctx.reply('✅ نام اکانت بروزرسانی شد.');
      return;
    }

    return next();
  });
}
