import axios, { AxiosInstance } from 'axios';
import { SUPABASE_MANAGEMENT_API } from '../config/constants';
import { logger } from '../utils/logger';

export interface SupabaseProject {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  status: string;
  created_at: string;
  database?: { host: string };
}

export interface CreateProjectParams {
  name: string;
  organization_id: string;
  region: string;
  db_pass: string;
  plan?: string;
}

export interface SqlRunResult {
  rows?: Record<string, unknown>[];
  rowCount?: number;
  error?: string;
}

/**
 * Thin, typed wrapper around the Supabase Management API.
 * One instance is created per-request with the caller's decrypted PAT —
 * tokens are never persisted in memory beyond the request lifecycle.
 */
export class SupabaseManagementClient {
  private http: AxiosInstance;

  constructor(personalAccessToken: string) {
    this.http = axios.create({
      baseURL: SUPABASE_MANAGEMENT_API,
      headers: {
        Authorization: `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
  }

  /** Validates the token by calling a lightweight authenticated endpoint. */
  async validateToken(): Promise<boolean> {
    try {
      await this.http.get('/organizations');
      return true;
    } catch (err) {
      logger.warn('Supabase token validation failed', { status: this.errStatus(err) });
      return false;
    }
  }

  async listOrganizations(): Promise<{ id: string; name: string }[]> {
    const { data } = await this.http.get('/organizations');
    return data;
  }

  async listProjects(): Promise<SupabaseProject[]> {
    const { data } = await this.http.get('/projects');
    return data;
  }

  async getProject(ref: string): Promise<SupabaseProject> {
    const { data } = await this.http.get(`/projects/${ref}`);
    return data;
  }

  async createProject(params: CreateProjectParams): Promise<SupabaseProject> {
    const { data } = await this.http.post('/projects', params);
    return data;
  }

  async deleteProject(ref: string): Promise<void> {
    await this.http.delete(`/projects/${ref}`);
  }

  async restartProject(ref: string): Promise<void> {
    await this.http.post(`/projects/${ref}/restart`);
  }

  async getApiKeys(ref: string): Promise<{ name: string; api_key: string }[]> {
    const { data } = await this.http.get(`/projects/${ref}/api-keys`);
    return data;
  }

  async getJwtSecret(ref: string): Promise<string | null> {
    try {
      const { data } = await this.http.get(`/projects/${ref}/config/auth`);
      return data?.jwt_secret ?? null;
    } catch {
      return null;
    }
  }

  async runSql(ref: string, query: string): Promise<SqlRunResult> {
    try {
      const { data } = await this.http.post(`/projects/${ref}/database/query`, { query });
      return { rows: Array.isArray(data) ? data : [], rowCount: Array.isArray(data) ? data.length : 0 };
    } catch (err: any) {
      return { error: err?.response?.data?.message || err.message || 'Unknown SQL error' };
    }
  }

  async listEdgeFunctions(ref: string) {
    const { data } = await this.http.get(`/projects/${ref}/functions`);
    return data;
  }

  async deployEdgeFunction(ref: string, slug: string, body: unknown) {
    const { data } = await this.http.post(`/projects/${ref}/functions/${slug}`, body);
    return data;
  }

  async deleteEdgeFunction(ref: string, slug: string) {
    await this.http.delete(`/projects/${ref}/functions/${slug}`);
  }

  async listSecrets(ref: string) {
    const { data } = await this.http.get(`/projects/${ref}/secrets`);
    return data;
  }

  async setSecrets(ref: string, secrets: { name: string; value: string }[]) {
    const { data } = await this.http.post(`/projects/${ref}/secrets`, secrets);
    return data;
  }

  async deleteSecret(ref: string, name: string) {
    await this.http.delete(`/projects/${ref}/secrets`, { data: [name] });
  }

  // ---------- Storage ----------
  async listBuckets(ref: string) {
    const { data } = await this.http.get(`/projects/${ref}/storage/buckets`);
    return data;
  }

  async createBucket(ref: string, name: string, isPublic = false) {
    const { data } = await this.http.post(`/projects/${ref}/storage/buckets`, {
      name,
      public: isPublic,
    });
    return data;
  }

  async deleteBucket(ref: string, name: string) {
    await this.http.delete(`/projects/${ref}/storage/buckets/${name}`);
  }

  // ---------- Auth (GoTrue admin) ----------
  async listAuthUsers(ref: string, page = 1) {
    const { data } = await this.http.get(`/projects/${ref}/auth/users`, { params: { page } });
    return data;
  }

  async deleteAuthUser(ref: string, userId: string) {
    await this.http.delete(`/projects/${ref}/auth/users/${userId}`);
  }

  async banAuthUser(ref: string, userId: string, duration = '876000h') {
    const { data } = await this.http.put(`/projects/${ref}/auth/users/${userId}`, {
      ban_duration: duration,
    });
    return data;
  }

  // ---------- Table Manager (via Management API SQL passthrough) ----------
  async listTables(ref: string, schema = 'public') {
    return this.runSql(
      ref,
      `select table_name from information_schema.tables where table_schema = '${schema}' order by table_name;`,
    );
  }

  // ---------- Migrations ----------
  async listMigrations(ref: string) {
    return this.runSql(ref, `select * from supabase_migrations.schema_migrations order by version desc;`);
  }

  // ---------- Logs ----------
  async getLogs(ref: string, sql: string) {
    const { data } = await this.http.get(`/projects/${ref}/analytics/endpoints/logs.all`, {
      params: { sql },
    });
    return data;
  }

  // ---------- Realtime ----------
  async getPostgresConfig(ref: string) {
    const { data } = await this.http.get(`/projects/${ref}/config/database/postgres`);
    return data;
  }

  private errStatus(err: unknown): number | undefined {
    return axios.isAxiosError(err) ? err.response?.status : undefined;
  }
}
