import { Markup } from 'telegraf';
import { CB, PAGE_SIZE, SUPABASE_REGIONS } from '../../config/constants';
import type { SupabaseProject } from '../../services/supabaseManagement.service';
import { backHomeRow } from './mainMenu.keyboard';

export function projectsListKeyboard(
  accountId: string,
  projects: SupabaseProject[],
  page: number,
) {
  const start = page * PAGE_SIZE;
  const pageItems = projects.slice(start, start + PAGE_SIZE);

  const rows = pageItems.map((p) => [
    Markup.button.callback(`${statusEmoji(p.status)} ${p.name}`, `${CB.PROJECTS_VIEW}:${accountId}:${p.id}`),
  ]);

  const navRow = [];
  if (page > 0) {
    navRow.push(Markup.button.callback('◀️ قبلی', `${CB.PROJECTS_LIST}:${accountId}:${page - 1}`));
  }
  if (start + PAGE_SIZE < projects.length) {
    navRow.push(Markup.button.callback('بعدی ▶️', `${CB.PROJECTS_LIST}:${accountId}:${page + 1}`));
  }
  if (navRow.length) rows.push(navRow);

  rows.push([Markup.button.callback('🆕 ساخت پروژه جدید', `${CB.PROJECTS_CREATE}:${accountId}`)]);
  rows.push([Markup.button.callback('🔄 بروزرسانی', `${CB.PROJECTS_LIST}:${accountId}:${page}`)]);
  rows.push(backHomeRow());
  return Markup.inlineKeyboard(rows);
}

export function projectDetailKeyboard(accountId: string, ref: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🧠 SQL Editor', `${CB.SQL_EDITOR}:${accountId}:${ref}`)],
    [Markup.button.callback('🔁 ریستارت پروژه', `${CB.PROJECTS_RESTART}:${accountId}:${ref}`)],
    [Markup.button.callback('🗑 حذف پروژه', `${CB.PROJECTS_DELETE}:${accountId}:${ref}`)],
    backHomeRow(),
  ]);
}

export function regionSelectKeyboard(accountId: string) {
  const rows = SUPABASE_REGIONS.map((r) => [
    Markup.button.callback(r.label, `region:${accountId}:${r.value}`),
  ]);
  rows.push(backHomeRow());
  return Markup.inlineKeyboard(rows);
}

export function copyButton(label: string, refKey: string) {
  return Markup.button.callback(`📋 کپی ${label}`, `${CB.COPY}:${refKey}`);
}

function statusEmoji(status: string) {
  if (status === 'ACTIVE_HEALTHY') return '🟢';
  if (status?.includes('PAUS')) return '⏸';
  if (status?.includes('COMING_UP') || status?.includes('RESTORING')) return '🟡';
  return '⚪️';
}
