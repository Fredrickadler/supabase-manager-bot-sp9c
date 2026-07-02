import type { Telegraf } from 'telegraf';
import type { AppContext } from '../middlewares/auth.middleware';
import { CB } from '../../config/constants';
import { projectService } from '../../services/project.service';
import { sessionRepository } from '../../repositories/session.repository';
import { projectNameSchema, dbPasswordSchema } from '../../utils/validators';
import {
  projectsListKeyboard,
  projectDetailKeyboard,
  regionSelectKeyboard,
} from '../keyboards/projects.keyboard';
import { confirmDeleteKeyboard } from '../keyboards/accounts.keyboard';
import { accountService } from '../../services/account.service';
import { buildCredentialsView } from '../helpers/credentials.helper';
import { retrieveForCopy } from '../../services/copyCache.service';
import { logger } from '../../utils/logger';

export function registerProjectsHandlers(bot: Telegraf<AppContext>) {
  bot.action(new RegExp(`^${CB.PROJECTS_LIST}:(.+):(\\d+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const [, accountId, pageStr] = ctx.match as RegExpMatchArray;
    const page = parseInt(pageStr, 10);
    try {
      const projects = await projectService.listProjects(accountId, ctx.state.user!.id);
      if (projects.length === 0) {
        await ctx.editMessageText(
          '📦 هنوز پروژه‌ای در این اکانت وجود ندارد.',
          projectsListKeyboard(accountId, [], 0),
        ).catch(() => {});
        return;
      }
      await ctx
        .editMessageText(
          `📦 پروژه‌ها (${projects.length}):`,
          projectsListKeyboard(accountId, projects, page),
        )
        .catch(() => {});
    } catch (err) {
      logger.error('list projects failed', { error: (err as Error).message });
      await ctx.reply('❌ خطا در دریافت لیست پروژه‌ها. توکن را بررسی کنید.');
    }
  });

  bot.action(new RegExp(`^${CB.PROJECTS_VIEW}:(.+):(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const [, accountId, ref] = ctx.match as RegExpMatchArray;
    try {
      const project = await projectService.getProject(accountId, ctx.state.user!.id, ref);
      const text = [
        `📦 *${project.name}*`,
        `Region: \`${project.region}\``,
        `Status: \`${project.status}\``,
        `Created: \`${new Date(project.created_at).toLocaleDateString('fa-IR')}\``,
      ].join('\n');
      await ctx
        .editMessageText(text, { parse_mode: 'Markdown', ...projectDetailKeyboard(accountId, ref) })
        .catch(() => ctx.reply(text, { parse_mode: 'Markdown', ...projectDetailKeyboard(accountId, ref) }));
    } catch {
      await ctx.reply('❌ خطا در دریافت اطلاعات پروژه.');
    }
  });

  bot.action(new RegExp(`^${CB.PROJECTS_RESTART}:(.+):(.+)$`), async (ctx) => {
    const [, accountId, ref] = ctx.match as RegExpMatchArray;
    await ctx.answerCbQuery('در حال ریستارت...');
    try {
      await projectService.restartProject(accountId, ctx.state.user!.id, ref);
      await ctx.reply('🔁 دستور ریستارت ارسال شد.');
    } catch {
      await ctx.reply('❌ ریستارت پروژه با خطا مواجه شد.');
    }
  });

  bot.action(new RegExp(`^${CB.PROJECTS_DELETE}:(.+):(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const [, accountId, ref] = ctx.match as RegExpMatchArray;
    await ctx.reply(
      '⚠️ آیا از حذف این پروژه مطمئن هستید؟ این عمل قابل بازگشت نیست.',
      confirmDeleteKeyboard(`${CB.PROJECTS_DELETE_CONFIRM}:${accountId}:${ref}`, CB.CANCEL),
    );
  });

  bot.action(new RegExp(`^${CB.PROJECTS_DELETE_CONFIRM}:(.+):(.+)$`), async (ctx) => {
    const [, accountId, ref] = ctx.match as RegExpMatchArray;
    await ctx.answerCbQuery('در حال حذف...');
    try {
      await projectService.deleteProject(accountId, ctx.state.user!.id, ref);
      await ctx.editMessageText('✅ پروژه حذف شد.').catch(() => {});
    } catch {
      await ctx.reply('❌ حذف پروژه با خطا مواجه شد.');
    }
  });

  // ----- Create project wizard -----
  bot.action(new RegExp(`^${CB.PROJECTS_CREATE}:(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const accountId = (ctx.match as RegExpMatchArray)[1];
    await sessionRepository.set(ctx.state.user!.id, 'proj_name', { accountId });
    await ctx.reply('📝 نام پروژه جدید را وارد کنید:');
  });

  bot.action(new RegExp(`^region:(.+):(.+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const [, accountId, region] = ctx.match as RegExpMatchArray;
    const session = await sessionRepository.get(ctx.state.user!.id);
    const context = { ...(session?.context as object), accountId, region };
    await sessionRepository.set(ctx.state.user!.id, 'proj_password', context);
    await ctx.reply('🔒 رمز عبور دیتابیس را وارد کنید (حداقل ۸ کاراکتر):');
  });

  bot.action(new RegExp(`^${CB.COPY}:(.+)$`), async (ctx) => {
    const ref = (ctx.match as RegExpMatchArray)[1];
    const value = retrieveForCopy(ref);
    if (!value) {
      await ctx.answerCbQuery('⌛️ این مقدار منقضی شده است.', { show_alert: true });
      return;
    }
    await ctx.answerCbQuery();
    await ctx.reply(`\`${value.replace(/[`]/g, '\\`')}\``, { parse_mode: 'Markdown' });
  });

  bot.on('text', async (ctx, next) => {
    const session = await sessionRepository.get(ctx.state.user!.id);
    if (!session?.step?.startsWith('proj_')) return next();

    const context = (session.context ?? {}) as Record<string, string>;

    if (session.step === 'proj_name') {
      const parsed = projectNameSchema.safeParse(ctx.message.text);
      if (!parsed.success) return ctx.reply(`❌ ${parsed.error.errors[0]?.message}`);
      await sessionRepository.set(ctx.state.user!.id, 'proj_org', {
        ...context,
        name: parsed.data,
      });
      try {
        const client = await accountService.getClient(context.accountId, ctx.state.user!.id);
        const orgs = await client.listOrganizations();
        if (orgs.length === 0) {
          await ctx.reply('❌ هیچ Organization‌ای در اکانت شما یافت نشد.');
          await sessionRepository.clear(ctx.state.user!.id);
          return;
        }
        if (orgs.length === 1) {
          await sessionRepository.set(ctx.state.user!.id, 'proj_region', {
            ...context,
            name: parsed.data,
            organization_id: orgs[0].id,
          });
          await ctx.reply('🌍 منطقه سرور را انتخاب کنید:', regionSelectKeyboard(context.accountId));
          return;
        }
        // multiple orgs — ask via simple numbered text reply to keep this concise
        await sessionRepository.set(ctx.state.user!.id, 'proj_org_select', {
          ...context,
          name: parsed.data,
          orgsJson: JSON.stringify(orgs),
        });
        await ctx.reply(
          'سازمان مورد نظر را با شماره انتخاب کنید:\n' +
            orgs.map((o, i) => `${i + 1}. ${o.name}`).join('\n'),
        );
      } catch {
        await ctx.reply('❌ خطا در دریافت لیست Organization ها.');
      }
      return;
    }

    if (session.step === 'proj_org_select') {
      const orgs = JSON.parse(context.orgsJson) as { id: string; name: string }[];
      const idx = parseInt(ctx.message.text.trim(), 10) - 1;
      if (isNaN(idx) || !orgs[idx]) return ctx.reply('❌ شماره نامعتبر است.');
      await sessionRepository.set(ctx.state.user!.id, 'proj_region', {
        ...context,
        organization_id: orgs[idx].id,
      });
      await ctx.reply('🌍 منطقه سرور را انتخاب کنید:', regionSelectKeyboard(context.accountId));
      return;
    }

    if (session.step === 'proj_password') {
      const parsed = dbPasswordSchema.safeParse(ctx.message.text);
      if (!parsed.success) return ctx.reply(`❌ ${parsed.error.errors[0]?.message}`);

      await ctx.reply('⏳ در حال ساخت پروژه... این عملیات ممکن است چند دقیقه طول بکشد.');
      try {
        const { project, keys, jwtSecret } = await projectService.createProject(
          context.accountId,
          ctx.state.user!.id,
          {
            name: context.name,
            organization_id: context.organization_id,
            region: context.region,
            db_pass: parsed.data,
          },
        );
        await sessionRepository.clear(ctx.state.user!.id);
        const { text, keyboard } = buildCredentialsView(project, keys, jwtSecret);
        await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
      } catch (err) {
        logger.error('create project failed', { error: (err as Error).message });
        await sessionRepository.clear(ctx.state.user!.id);
        await ctx.reply('❌ ساخت پروژه با خطا مواجه شد. لطفاً بعداً دوباره تلاش کنید.');
      }
      return;
    }

    return next();
  });
}
