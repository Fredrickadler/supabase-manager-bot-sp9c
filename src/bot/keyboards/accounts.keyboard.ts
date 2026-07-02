import { Markup } from 'telegraf';
import { CB } from '../../config/constants';
import type { SupabaseAccount } from '@prisma/client';
import { backHomeRow } from './mainMenu.keyboard';

export function accountsListKeyboard(accounts: SupabaseAccount[]) {
  const rows = accounts.map((a) => [
    Markup.button.callback(
      `${a.isDefault ? '⭐ ' : ''}${a.label}`,
      `${CB.ACCOUNTS_VIEW}:${a.id}`,
    ),
  ]);
  rows.push([Markup.button.callback('➕ افزودن اکانت جدید', CB.ACCOUNTS_ADD)]);
  rows.push(backHomeRow());
  return Markup.inlineKeyboard(rows);
}

export function accountDetailKeyboard(account: SupabaseAccount) {
  const rows = [
    [Markup.button.callback('📦 پروژه‌ها', `${CB.PROJECTS_LIST}:${account.id}:0`)],
    [Markup.button.callback('✏️ تغییر نام', `${CB.ACCOUNTS_RENAME}:${account.id}`)],
    [
      Markup.button.callback(
        account.isDefault ? '⭐ اکانت پیش‌فرض' : '☆ تنظیم به عنوان پیش‌فرض',
        `${CB.ACCOUNTS_SET_DEFAULT}:${account.id}`,
      ),
    ],
    [Markup.button.callback('🗑 حذف اکانت', `${CB.ACCOUNTS_DELETE}:${account.id}`)],
    backHomeRow(),
  ];
  return Markup.inlineKeyboard(rows);
}

export function confirmDeleteKeyboard(confirmCb: string, cancelCb: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ بله، حذف کن', confirmCb),
      Markup.button.callback('❌ انصراف', cancelCb),
    ],
  ]);
}
