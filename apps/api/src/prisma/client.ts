import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton — evita múltiplas conexões (especialmente importante
 * em serverless/Vercel, onde cold start pode criar novos clients).
 * Log detalhado só em dev para não poluir produção.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV !== "production" ? ["query", "error", "warn"] : ["error"],
});

export default prisma;
