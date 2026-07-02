import type { Telegraf } from 'telegraf';
import type { AppContext } from '../middlewares/auth.middleware';
import { CB } from '../../config/constants';
import { sessionRepository } from '../../repositories/session.repository';
import { sqlService } from '../../services/sql.service';
import { Markup } from 'telegraf';
import axios from 'axios';
import { logger } from '../../utils/logger';

export function registerSqlEditorHandlers(bot: Telegraf<AppContext>) {
  bot.action(new RegExp(`^${CB.SQL_EDITOR}:(.+):(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const [, accountId, ref] = ctx.match as RegExpMatchArray;
    await sessionRepository.set(ctx.state.user!.id, 'sql_wait', { accountId, ref });
    await ctx.reply(
      [
        '🧠 SQL Editor فعال شد.',
        '',
        'کوئری SQL خود را ارسال کنید یا یک فایل .sql آپلود کنید.',
        'برای خروج، /start را بزنید.',
      ].join('\n'),
      Markup.inlineKeyboard([[Markup.button.callback('🏠 خانه', CB.HOME)]]),
    );
  });

  bot.on('text', async (ctx, next) => {
    const session = await sessionRepository.get(ctx.state.user!.id);
    if (session?.step !== 'sql_wait') return next();

    const { accountId, ref } = session.context as { accountId: string; ref: string };
    await runAndReply(ctx, accountId, ref, ctx.message.text);
  });

  bot.on('document', async (ctx, next) => {
    const session = await sessionRepository.get(ctx.state.user!.id);
    if (session?.step !== 'sql_wait') return next();

    const doc = ctx.message.document;
    if (!doc.file_name?.toLowerCase().endsWith('.sql')) {
      await ctx.reply('❌ فقط فایل با پسوند .sql پذیرفته می‌شود.');
      return;
    }
    if (doc.file_size && doc.file_size > 2 * 1024 * 1024) {
      await ctx.reply('❌ حجم فایل نباید بیشتر از ۲ مگابایت باشد.');
      return;
    }

    try {
      const link = await ctx.telegram.getFileLink(doc.file_id);
      const { data } = await axios.get(link.href, { responseType: 'text' });
      const { accountId, ref } = session.context as { accountId: string; ref: string };
      await runAndReply(ctx, accountId, ref, data);
    } catch (err) {
      logger.error('sql file read failed', { error: (err as Error).message });
      await ctx.reply('❌ خطا در خواندن فایل.');
    }
  });
}

async function runAndReply(ctx: AppContext, accountId: string, ref: string, query: string) {
  await ctx.reply('⏳ در حال اجرای کوئری...');
  const result = await sqlService.run(accountId, ctx.state.user!.id, ref, query);

  if (result.error) {
    await ctx.reply(`❌ خطا در اجرای SQL:\n\`\`\`\n${truncate(result.error)}\n\`\`\``, {
      parse_mode: 'Markdown',
    });
    return;
  }

  await ctx.reply(`✅ اجرا موفق بود.\nتعداد ردیف‌های بازگشتی: ${result.rowCount ?? 0}`);

  if (result.rows && result.rows.length > 0) {
    const preview = JSON.stringify(result.rows.slice(0, 10), null, 2);
    await ctx.reply(`\`\`\`\n${truncate(preview)}\n\`\`\``, { parse_mode: 'Markdown' });
  }
}

function truncate(text: string, max = 3500): string {
  return text.length > max ? `${text.slice(0, max)}\n… (بریده شد)` : text;
}
