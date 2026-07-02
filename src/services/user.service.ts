import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import type { User } from '@prisma/client';

export class UserService {
  async registerOrTouch(tgUser: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const telegramId = BigInt(tgUser.id);
    return userRepository.upsertFromTelegram({
      telegramId,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      isAdmin: env.adminIds.includes(telegramId),
    });
  }

  isAdmin(user: User): boolean {
    return user.isAdmin || env.adminIds.includes(user.telegramId);
  }
}

export const userService = new UserService();
