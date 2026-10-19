import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import prisma from "../prisma/client";

/**
 * Fastify plugin — registra instância única do Prisma Client como decorator.
 * Usa fastify-plugin pra elevar o decorator (visível em plugins filhos).
 */
export const prismaPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorate("prisma", prisma);
});

// Type augmentation — fastify.prisma tipado
declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}
