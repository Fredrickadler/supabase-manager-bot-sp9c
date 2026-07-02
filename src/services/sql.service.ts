import { accountService } from './account.service';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { sqlQuerySchema } from '../utils/validators';

export class SqlService {
  async run(accountId: string, userId: string, projectRef: string, query: string) {
    const parsed = sqlQuerySchema.safeParse(query);
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? 'کوئری نامعتبر است' };
    }

    const client = await accountService.getClient(accountId, userId);
    const result = await client.runSql(projectRef, parsed.data);

    await auditLogRepository.log({
      userId,
      action: 'sql.run',
      metadata: { projectRef, ok: !result.error },
      isError: Boolean(result.error),
    });

    return result;
  }
}

export const sqlService = new SqlService();
