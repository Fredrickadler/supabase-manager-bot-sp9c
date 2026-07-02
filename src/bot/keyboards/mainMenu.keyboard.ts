import { Markup } from 'telegraf';
import { CB } from '../../config/constants';

export function mainMenuKeyboard(isAdmin: boolean) {
  const rows = [
    [Markup.button.callback('🔑 اکانت‌های Supabase', CB.ACCOUNTS_LIST)],
    [Markup.button.callback('➕ افزودن اکانت جدید', CB.ACCOUNTS_ADD)],
  ];
  if (isAdmin) {
    rows.push([Markup.button.callback('🛠 پنل ادمین', CB.ADMIN_HOME)]);
  }
  return Markup.inlineKeyboard(rows);
}

export function backHomeRow() {
  return [
    Markup.button.callback('⬅️ بازگشت', CB.BACK),
    Markup.button.callback('🏠 خانه', CB.HOME),
  ];
}
