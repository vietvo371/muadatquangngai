import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 mặc định dùng "client" engine (query compiler WASM, không còn engine
// binary nhúng sẵn) — bắt buộc truyền driver adapter cho Postgres, khác với Prisma
// 5/6 trước đây (chỉ cần connection string trong datasource là đủ).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Singleton Prisma client — tránh mở nhiều connection pool khi Next.js hot-reload
// tạo lại module trong dev. Cùng pattern với `db.ts` mô tả trong .claude/rules/tech-stack.md.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
