import { db } from '../database/prisma';
import { normalizeRepoName } from '../utils/helpers';

export interface RepositoryMappingRecord {
  id: string;
  guildId: string;
  repositoryName: string;
  channelId: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

export class MappingService {
  private static cache: Map<string, RepositoryMappingRecord[]> = new Map();
  private static isCacheWarmed = false;

  public static async warmCache(): Promise<void> {
    try {
      const result = await db.execute('SELECT id, guildId, repositoryName, channelId FROM RepositoryMapping');
      this.cache.clear();
      for (const row of result.rows) {
        const record: RepositoryMappingRecord = {
          id: row.id as string,
          guildId: row.guildId as string,
          repositoryName: row.repositoryName as string,
          channelId: row.channelId as string,
        };
        const repoKey = normalizeRepoName(record.repositoryName);
        const existing = this.cache.get(repoKey) || [];
        existing.push(record);
        this.cache.set(repoKey, existing);
      }
      this.isCacheWarmed = true;
      console.log(`📦 Mapping cache pre-warmed with ${result.rows.length} record(s).`);
    } catch (error) {
      console.error('⚠️ Could not warm cache from database:', error);
    }
  }

  public static async getMappingsForRepo(repoName: string): Promise<RepositoryMappingRecord[]> {
    const key = normalizeRepoName(repoName);

    if (this.isCacheWarmed && this.cache.has(key)) {
      return this.cache.get(key) || [];
    }

    try {
      const result = await db.execute(
        'SELECT id, guildId, repositoryName, channelId FROM RepositoryMapping WHERE LOWER(repositoryName) = ?',
        [key]
      );
      const records: RepositoryMappingRecord[] = result.rows.map((row) => ({
        id: row.id as string,
        guildId: row.guildId as string,
        repositoryName: row.repositoryName as string,
        channelId: row.channelId as string,
      }));
      this.cache.set(key, records);
      return records;
    } catch (error) {
      console.error(`❌ Error fetching mapping for repo ${repoName}:`, error);
      return [];
    }
  }

  public static async addMapping(guildId: string, repoName: string, channelId: string, guildName?: string): Promise<RepositoryMappingRecord> {
    const normalizedRepo = normalizeRepoName(repoName);

    // Upsert guild
    const existingGuild = await db.execute('SELECT id FROM Guild WHERE guildId = ?', [guildId]);
    if (existingGuild.rows.length === 0) {
      await db.execute(
        'INSERT INTO Guild (id, guildId, name, createdAt) VALUES (?, ?, ?, datetime("now"))',
        [generateId(), guildId, guildName || null]
      );
    }

    // Upsert mapping
    const existingMapping = await db.execute(
      'SELECT id FROM RepositoryMapping WHERE guildId = ? AND repositoryName = ?',
      [guildId, normalizedRepo]
    );

    let mappingId: string;
    if (existingMapping.rows.length > 0) {
      mappingId = existingMapping.rows[0].id as string;
      await db.execute(
        'UPDATE RepositoryMapping SET channelId = ?, updatedAt = datetime("now") WHERE id = ?',
        [channelId, mappingId]
      );
    } else {
      mappingId = generateId();
      await db.execute(
        'INSERT INTO RepositoryMapping (id, guildId, repositoryName, channelId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
        [mappingId, guildId, normalizedRepo, channelId]
      );
    }

    await this.warmCache();

    return { id: mappingId, guildId, repositoryName: normalizedRepo, channelId };
  }

  public static async removeMapping(guildId: string, repoName: string): Promise<boolean> {
    const normalizedRepo = normalizeRepoName(repoName);

    try {
      const existing = await db.execute(
        'SELECT id FROM RepositoryMapping WHERE guildId = ? AND repositoryName = ?',
        [guildId, normalizedRepo]
      );
      if (existing.rows.length === 0) return false;

      await db.execute(
        'DELETE FROM RepositoryMapping WHERE guildId = ? AND repositoryName = ?',
        [guildId, normalizedRepo]
      );

      await this.warmCache();
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove mapping for ${repoName} in guild ${guildId}:`, error);
      return false;
    }
  }

  public static async listGuildMappings(guildId: string): Promise<RepositoryMappingRecord[]> {
    try {
      const result = await db.execute(
        'SELECT id, guildId, repositoryName, channelId FROM RepositoryMapping WHERE guildId = ? ORDER BY createdAt DESC',
        [guildId]
      );
      return result.rows.map((row) => ({
        id: row.id as string,
        guildId: row.guildId as string,
        repositoryName: row.repositoryName as string,
        channelId: row.channelId as string,
      }));
    } catch (error) {
      console.error(`❌ Error listing mappings for guild ${guildId}:`, error);
      return [];
    }
  }
}
