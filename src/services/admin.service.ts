import { userRepository } from '../repositories/user.repository';
import { accountRepository } from '../repositories/account.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import type { Telegraf } from 'telegraf';

export class AdminService {
  async getStats() {
    const [users, accounts, requests] = await Promise.all([
      userRepository.count(),
      accountRepository.count(),
      auditLogRepository.countRequests(),
    ]);
    return { users, accounts, requests };
  }

  async blockUser(userId: string, blocked: boolean) {
    return userRepository.setBlocked(userId, blocked);
  }

  async recentErrors(limit = 10) {
    return auditLogRepository.recentErrors(limit);
  }

  /** Sends a message to every active (non-blocked) user. Returns delivery stats. */
  async broadcast(bot: Telegraf, text: string): Promise<{ sent: number; failed: number }> {
    const users = await userRepository.findAllActive();
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.telegramId.toString(), text);
        sent++;
      } catch {
        failed++;
      }
      // gentle throttle to respect Telegram rate limits (~30 msgs/sec)
      await new Promise((r) => setTimeout(r, 40));
    }

    return { sent, failed };
  }
}

export const adminService = new AdminService();
