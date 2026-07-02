import { prisma } from '../config/prisma';
import type { Prisma } from '@prisma/client';

export class SessionRepository {
  async get(userId: string) {
    return prisma.session.findUnique({ where: { userId } });
  }

  async set(userId: string, step: string | null, context: Prisma.InputJsonValue | undefined) {
    return prisma.session.upsert({
      where: { userId },
      update: { step, context },
      create: { userId, step, context },
    });
  }

  async clear(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
  }
}

export const sessionRepository = new SessionRepository();
