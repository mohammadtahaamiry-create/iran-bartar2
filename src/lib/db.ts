import { PrismaClient } from '@prisma/client'

// Cache the client across hot-reloads in dev. In production, the module is
// evaluated once per process, so a fresh client on import is fine.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // In production, do NOT log queries — it leaks sensitive data to logs and
  // slows down every request. In dev, log errors + warns only (not every query).
  const isProd = process.env.NODE_ENV === 'production'
  return new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn', 'info'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown — close the DB connection when the process exits.
// Without this, `docker compose down` can leave dangling connections.
if (!globalForPrisma.prisma) {
  const cleanup = async (signal: string) => {
    try {
      await db.$disconnect()
      console.log(`[db] disconnected on ${signal}`)
    } catch (e) {
      console.error('[db] error during disconnect:', e)
    }
    process.exit(0)
  }
  process.on('SIGINT', () => cleanup('SIGINT'))
  process.on('SIGTERM', () => cleanup('SIGTERM'))
}