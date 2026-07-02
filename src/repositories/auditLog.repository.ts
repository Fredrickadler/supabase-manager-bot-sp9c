import { prisma } from '../config/prisma';
import type { Prisma } from '@prisma/client';

export class AuditLogRepository {
  async log(params: {
    userId?: string;
    action: string;
    metadata?: Prisma.InputJsonValue;
    isError?: boolean;
  }) {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        metadata: params.metadata,
        isError: params.isError ?? false,
      },
    });
  }

  async recentErrors(limit = 10) {
    return prisma.auditLog.findMany({
      where: { isError: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countRequests() {
    return prisma.auditLog.count();
  }
}

export const auditLogRepository = new AuditLogRepository();
