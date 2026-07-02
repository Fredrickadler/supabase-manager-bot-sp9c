import { Markup } from 'telegraf';
import { CB } from '../../config/constants';
import { storeForCopy } from '../../services/copyCache.service';
import type { SupabaseProject } from '../../services/supabaseManagement.service';

export function buildCredentialsView(
  project: SupabaseProject,
  keys: { name: string; api_key: string }[],
  jwtSecret: string | null,
) {
  const anon = keys.find((k) => k.name === 'anon')?.api_key;
  const serviceRole = keys.find((k) => k.name === 'service_role')?.api_key;
  const publishable = keys.find((k) => k.name.includes('publishable'))?.api_key;

  const fields: { label: string; value: string }[] = [
    { label: 'Project URL', value: `https://${project.id}.supabase.co` },
    ...(anon ? [{ label: 'Anon Key', value: anon }] : []),
    ...(publishable ? [{ label: 'Publishable Key', value: publishable }] : []),
    ...(serviceRole ? [{ label: 'Service Role Key', value: serviceRole }] : []),
    { label: 'Database Host', value: project.database?.host ?? `db.${project.id}.supabase.co` },
    { label: 'Database Port', value: '5432' },
    { label: 'Database Name', value: 'postgres' },
    { label: 'Database User', value: 'postgres' },
    ...(jwtSecret ? [{ label: 'JWT Secret', value: jwtSecret }] : []),
  ];

  const lines = [`✅ پروژه *${escapeMd(project.name)}* با موفقیت ساخته شد.`, ''];
  const buttons = [];

  for (const f of fields) {
    lines.push(`*${f.label}:*\n\`${escapeMd(f.value)}\``);
    lines.push('');
    const ref = storeForCopy(f.value);
    buttons.push([Markup.button.callback(`📋 کپی ${f.label}`, `${CB.COPY}:${ref}`)]);
  }

  buttons.push([Markup.button.callback('🏠 خانه', CB.HOME)]);

  return { text: lines.join('\n'), keyboard: Markup.inlineKeyboard(buttons) };
}

function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
