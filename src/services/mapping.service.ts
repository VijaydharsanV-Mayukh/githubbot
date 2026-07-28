import { prisma } from '../database/prisma';
import { normalizeRepoName } from '../utils/helpers';

export interface RepositoryMappingRecord {
  id: string;
  guildId: string;
  repositoryName: string;
  channelId: string;
}

export class MappingService {
  // In-memory mapping cache for zero-latency lookup
  private static cache: Map<string, RepositoryMappingRecord[]> = new Map();
  private static isCacheWarmed = false;

  /**
   * Pre-warms cache with all database mappings
   */
  public static async warmCache(): Promise<void> {
    try {
      const allMappings = await prisma.repositoryMapping.findMany();
      this.cache.clear();
      for (const m of allMappings) {
        const repoKey = normalizeRepoName(m.repositoryName);
        const existing = this.cache.get(repoKey) || [];
        existing.push(m);
        this.cache.set(repoKey, existing);
      }
      this.isCacheWarmed = true;
      console.log(`📦 Mapping cache pre-warmed with ${allMappings.length} record(s).`);
    } catch (error) {
      console.error('⚠️ Could not warm cache from database:', error);
    }
  }

  /**
   * Finds all channel mappings for a given repository
   */
  public static async getMappingsForRepo(repoName: string): Promise<RepositoryMappingRecord[]> {
    const key = normalizeRepoName(repoName);

    if (this.isCacheWarmed && this.cache.has(key)) {
      return this.cache.get(key) || [];
    }

    try {
      const records = await prisma.repositoryMapping.findMany({
        where: {
          repositoryName: {
            equals: key,
          },
        },
      });

      this.cache.set(key, records);
      return records;
    } catch (error) {
      console.error(`❌ Error fetching mapping for repo ${repoName}:`, error);
      return [];
    }
  }

  /**
   * Adds or updates a repository mapping
   */
  public static async addMapping(guildId: string, repoName: string, channelId: string, guildName?: string): Promise<RepositoryMappingRecord> {
    const normalizedRepo = normalizeRepoName(repoName);

    // Ensure guild exists
    await prisma.guild.upsert({
      where: { guildId },
      update: { name: guildName },
      create: { guildId, name: guildName },
    });

    // Create or update mapping
    const mapping = await prisma.repositoryMapping.upsert({
      where: {
        guildId_repositoryName: {
          guildId,
          repositoryName: normalizedRepo,
        },
      },
      update: {
        channelId,
      },
      create: {
        guildId,
        repositoryName: normalizedRepo,
        channelId,
      },
    });

    // Invalidate cache
    await this.warmCache();

    return mapping;
  }

  /**
   * Removes a repository mapping
   */
  public static async removeMapping(guildId: string, repoName: string): Promise<boolean> {
    const normalizedRepo = normalizeRepoName(repoName);

    try {
      await prisma.repositoryMapping.delete({
        where: {
          guildId_repositoryName: {
            guildId,
            repositoryName: normalizedRepo,
          },
        },
      });

      await this.warmCache();
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove mapping for ${repoName} in guild ${guildId}:`, error);
      return false;
    }
  }

  /**
   * Lists all mappings for a specific guild
   */
  public static async listGuildMappings(guildId: string): Promise<RepositoryMappingRecord[]> {
    try {
      return await prisma.repositoryMapping.findMany({
        where: { guildId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error(`❌ Error listing mappings for guild ${guildId}:`, error);
      return [];
    }
  }
}
