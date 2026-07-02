import { accountService } from './account.service';
import { auditLogRepository } from '../repositories/auditLog.repository';
import type { CreateProjectParams } from './supabaseManagement.service';

export class ProjectService {
  async listProjects(accountId: string, userId: string) {
    const client = await accountService.getClient(accountId, userId);
    return client.listProjects();
  }

  async getProject(accountId: string, userId: string, ref: string) {
    const client = await accountService.getClient(accountId, userId);
    return client.getProject(ref);
  }

  async createProject(accountId: string, userId: string, params: CreateProjectParams) {
    const client = await accountService.getClient(accountId, userId);
    const project = await client.createProject(params);
    await auditLogRepository.log({
      userId,
      action: 'project.create',
      metadata: { name: params.name, region: params.region },
    });

    // Fetch credentials right after creation
    const [keys, jwtSecret] = await Promise.all([
      client.getApiKeys(project.id).catch(() => []),
      client.getJwtSecret(project.id).catch(() => null),
    ]);

    return { project, keys, jwtSecret };
  }

  async deleteProject(accountId: string, userId: string, ref: string) {
    const client = await accountService.getClient(accountId, userId);
    await client.deleteProject(ref);
    await auditLogRepository.log({ userId, action: 'project.delete', metadata: { ref } });
  }

  async restartProject(accountId: string, userId: string, ref: string) {
    const client = await accountService.getClient(accountId, userId);
    await client.restartProject(ref);
    await auditLogRepository.log({ userId, action: 'project.restart', metadata: { ref } });
  }

  async getCredentials(accountId: string, userId: string, ref: string) {
    const client = await accountService.getClient(accountId, userId);
    const [project, keys, jwtSecret] = await Promise.all([
      client.getProject(ref),
      client.getApiKeys(ref).catch(() => []),
      client.getJwtSecret(ref).catch(() => null),
    ]);
    return { project, keys, jwtSecret };
  }
}

export const projectService = new ProjectService();
