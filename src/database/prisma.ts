import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Enable Vercel serverless writable SQLite database support in /tmp
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
        // Touch empty file if missing
        fs.writeFileSync(tmpDbPath, '');
      }
    } catch (e) {
      console.error('⚠️ Could not copy SQLite database to /tmp:', e);
    }
  }
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
