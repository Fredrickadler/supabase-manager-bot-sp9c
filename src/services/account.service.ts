import { accountRepository } from '../repositories/account.repository';
import { encrypt, decrypt } from './encryption.service';
import { SupabaseManagementClient } from './supabaseManagement.service';
import { auditLogRepository } from '../repositories/auditLog.repository';
import type { SupabaseAccount } from '@prisma/client';

export class AccountService {
  async listAccounts(userId: string): Promise<SupabaseAccount[]> {
    return accountRepository.listByUser(userId);
  }

  async getAccount(id: string, userId: string): Promise<SupabaseAccount | null> {
    return accountRepository.findById(id, userId);
  }

  /** Validates the token against Supabase, then stores it encrypted. */
  async addAccount(userId: string, label: string, token: string): Promise<SupabaseAccount> {
    const client = new SupabaseManagementClient(token);
    const valid = await client.validateToken();
    if (!valid) {
      throw new Error('توکن نامعتبر است یا دسترسی لازم را ندارد.');
    }

    const existing = await accountRepository.listByUser(userId);
    const account = await accountRepository.create({
      userId,
      label,
      encryptedToken: encrypt(token),
      isDefault: existing.length === 0, // first account becomes default automatically
    });

    await auditLogRepository.log({ userId, action: 'account.add', metadata: { label } });
    return account;
  }

  async deleteAccount(id: string, userId: string): Promise<void> {
    await accountRepository.delete(id, userId);
    await auditLogRepository.log({ userId, action: 'account.delete', metadata: { id } });
  }

  async renameAccount(id: string, userId: string, label: string): Promise<void> {
    await accountRepository.rename(id, userId, label);
  }

  async setDefault(id: string, userId: string): Promise<void> {
    await accountRepository.setDefault(id, userId);
  }

  /** Returns a ready-to-use Management API client for the given account. */
  async getClient(id: string, userId: string): Promise<SupabaseManagementClient> {
    const account = await accountRepository.findById(id, userId);
    if (!account) throw new Error('اکانت یافت نشد.');
    const token = decrypt(account.encryptedToken);
    return new SupabaseManagementClient(token);
  }
}

export const accountService = new AccountService();
