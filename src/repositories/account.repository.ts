import { prisma } from '../config/prisma';
import type { SupabaseAccount } from '@prisma/client';

export class AccountRepository {
  async listByUser(userId: string): Promise<SupabaseAccount[]> {
    return prisma.supabaseAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, userId: string): Promise<SupabaseAccount | null> {
    return prisma.supabaseAccount.findFirst({ where: { id, userId } });
  }

  async create(params: {
    userId: string;
    label: string;
    encryptedToken: string;
    isDefault: boolean;
  }): Promise<SupabaseAccount> {
    if (params.isDefault) {
      await prisma.supabaseAccount.updateMany({
        where: { userId: params.userId },
        data: { isDefault: false },
      });
    }
    return prisma.supabaseAccount.create({ data: params });
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.supabaseAccount.deleteMany({ where: { id, userId } });
  }

  async rename(id: string, userId: string, label: string): Promise<void> {
    await prisma.supabaseAccount.updateMany({ where: { id, userId }, data: { label } });
  }

  async setDefault(id: string, userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.supabaseAccount.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.supabaseAccount.updateMany({ where: { id, userId }, data: { isDefault: true } }),
    ]);
  }

  async getDefault(userId: string): Promise<SupabaseAccount | null> {
    return prisma.supabaseAccount.findFirst({ where: { userId, isDefault: true } });
  }

  async count(): Promise<number> {
    return prisma.supabaseAccount.count();
  }
}

export const accountRepository = new AccountRepository();
