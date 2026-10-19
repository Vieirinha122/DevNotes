import "dotenv/config";
import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";

/**
 * Cria e configura a instância do Fastify.
 * Separado de index.ts (entry dev) e api/index.ts (entry Vercel)
 * para permitir reutilização sem side effects de listen().
 */
export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "production",
  });

  // Middlewares globais
  void app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
  });
  void app.register(helmet);

  // Health check
  app.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // Hello world da API
  app.get("/api/v1", () => ({
    message: "DevNote API — casca rodando",
    version: "0.0.0",
  }));

  return app;
}

// Exporta o request ID padrão (UUID gerado no cliente, usado depois no sync)
export { randomUUID as gerarUuid };
