import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

  // Support for Turso Cloud SQLite Database (libsql://)
  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
    console.log('🌐 Connecting to Turso Cloud SQLite database...');
    try {
      const libsql = createClient({
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      const adapter = new (PrismaLibSql as any)(libsql);
      return new PrismaClient({ adapter });
    } catch (e) {
      console.error('⚠️ Could not initialize Turso adapter:', e);
    }
  }

  // Local SQLite File Handling for Vercel / Local Dev
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = '/tmp/dev.db';
    const rootDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const localDbPath = path.join(process.cwd(), 'dev.db');

    if (!fs.existsSync(tmpDbPath)) {
      try {
        if (fs.existsSync(rootDbPath)) {
          fs.copyFileSync(rootDbPath, tmpDbPath);
        } else if (fs.existsSync(localDbPath)) {
          fs.copyFileSync(localDbPath, tmpDbPath);
        } else {
          fs.writeFileSync(tmpDbPath, '');
        }
      } catch (e) {
        console.error('⚠️ Could not copy SQLite database to /tmp:', e);
      }
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  }

  return new PrismaClient();
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
