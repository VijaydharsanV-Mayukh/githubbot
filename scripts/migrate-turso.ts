import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DATABASE_URL || '';
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

if (!DB_URL.startsWith('libsql://')) {
  console.error('❌ DATABASE_URL must be a Turso libsql:// URL');
  process.exit(1);
}

const client = createClient({
  url: DB_URL,
  authToken: AUTH_TOKEN,
});

async function migrate() {
  console.log('🚀 Creating tables in Turso database...\n');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Guild (
      id TEXT PRIMARY KEY,
      guildId TEXT NOT NULL UNIQUE,
      name TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Created table: Guild');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS RepositoryMapping (
      id TEXT PRIMARY KEY,
      guildId TEXT NOT NULL,
      repositoryName TEXT NOT NULL,
      channelId TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guildId) REFERENCES Guild(guildId) ON DELETE CASCADE
    )
  `);
  console.log('✅ Created table: RepositoryMapping');

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS RepositoryMapping_guildId_repositoryName_key
    ON RepositoryMapping(guildId, repositoryName)
  `);
  console.log('✅ Created unique index: guildId + repositoryName');

  console.log('\n🎉 Turso database migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
