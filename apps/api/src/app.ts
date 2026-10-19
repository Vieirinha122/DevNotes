import "dotenv/config";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { authRoutes } from "./modules/auth/auth.routes";
import { prismaPlugin } from "./plugins/prisma.plugin";

/**
 * Cria e configura a instância do Fastify.
 * Separado de index.ts (entry dev) e api/index.ts (entry Vercel)
 * para permitir reutilização sem side effects de listen().
 *
 * Plugins registrados:
 * - cors (origins da env)
 * - helmet (security headers)
 * - cookie (HttpOnly cookies)
 * - jwt (access tokens)
 * - rate-limit (global + reforçado em auth)
 * - prismaPlugin (decorator)
 */
export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "production",
  });

  // ── Middlewares globais ──────────────────────────────────────
  void app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
  });
  void app.register(helmet);
  void app.register(cookie);
  void app.register(prismaPlugin);

  // ── JWT (access token: 15min) ────────────────────────────────
  // Nota: refresh token é token aleatório (crypto.randomBytes) salvo no
  // banco, NÃO um JWT. Só access token usa JWT aqui.
  void app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
    sign: {
      expiresIn: Number(process.env.JWT_ACCESS_TTL) || 900,
    },
  });

  // ── Rate limit (global: 100/min, refletido nas rotas) ────────
  // Nota: memory store não funciona bem em serverless (Vercel).
  // TODO: migrar pra @vercel/kv ou Redis quando for produção.
  void app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // ── Rotas ────────────────────────────────────────────────────
  app.get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }));

  app.get("/api/v1", () => ({
    message: "DevNote API",
    version: "0.1.0",
  }));

  // Módulo auth — register/login/refresh/logout
  void app.register(authRoutes, { prefix: "/api/v1/auth" });

  return app;
}
