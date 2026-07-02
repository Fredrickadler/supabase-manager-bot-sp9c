import { prisma } from '../config/prisma';
import type { User } from '@prisma/client';

export class UserRepository {
  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({ where: { telegramId } });
  }

  async upsertFromTelegram(params: {
    telegramId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { telegramId: params.telegramId },
      update: {
        username: params.username,
        firstName: params.firstName,
        lastName: params.lastName,
      },
      create: {
        telegramId: params.telegramId,
        username: params.username,
        firstName: params.firstName,
        lastName: params.lastName,
        isAdmin: params.isAdmin ?? false,
      },
    });
  }

  async setBlocked(userId: string, isBlocked: boolean): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data: { isBlocked } });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }

  async findAllActive(): Promise<User[]> {
    return prisma.user.findMany({ where: { isBlocked: false } });
  }
}

export const userRepository = new UserRepository();
