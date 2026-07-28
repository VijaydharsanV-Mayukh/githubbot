import { createClient, Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let dbClient: Client;

function getClient(): Client {
  if (dbClient) return dbClient;

  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
    console.log('🌐 Connecting to Turso Cloud SQLite database...');
    dbClient = createClient({ url: dbUrl, authToken });
  } else {
    console.log('💾 Using local SQLite database...');
    dbClient = createClient({ url: dbUrl });
  }

  return dbClient;
}

export const db = {
  get client() {
    return getClient();
  },

  async execute(sql: string, args?: any[]) {
    return getClient().execute({ sql, args: args || [] });
  },
};
