// src/app.ts
import "dotenv/config";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

// src/modules/auth/auth.schema.ts
import { z } from "zod";
var RegisterBodySchema = z.object({
  email: z.string().email("Email inv\xE1lido"),
  password: z.string().min(8, "Senha precisa de pelo menos 8 caracteres").max(128, "Senha muito longa")
});
var LoginBodySchema = z.object({
  email: z.string().email("Email inv\xE1lido"),
  password: z.string().min(1, "Senha obrigat\xF3ria")
});

// src/modules/auth/auth.service.ts
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

// src/prisma/client.ts
import { PrismaClient } from "@prisma/client";
var prisma = new PrismaClient({
  log: process.env.NODE_ENV !== "production" ? ["query", "error", "warn"] : ["error"]
});
var client_default = prisma;

// src/modules/auth/auth.service.ts
var BCRYPT_COST = 12;
async function hashSenha(senha) {
  return bcrypt.hash(senha, BCRYPT_COST);
}
async function compararSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
function gerarRefreshToken() {
  return randomBytes(32).toString("hex");
}
async function registrarUsuario(email, senha) {
  const exists = await client_default.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email j\xE1 cadastrado");
  const senhaHash = await hashSenha(senha);
  return client_default.user.create({
    data: { email, passwordHash: senhaHash },
    select: { id: true, email: true, createdAt: true, updatedAt: true }
  });
}
async function autenticarUsuario(email, senha) {
  const user = await client_default.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true }
  });
  if (!user) throw new Error("Credenciais inv\xE1lidas");
  const valido = await compararSenha(senha, user.passwordHash);
  if (!valido) throw new Error("Credenciais inv\xE1lidas");
  const { passwordHash: _omit, ...usuario } = user;
  return usuario;
}
async function salvarSessao(userId, refreshToken, deviceId) {
  const expiresAt = new Date(Date.now() + (Number(process.env.JWT_REFRESH_TTL) || 604800) * 1e3);
  return client_default.session.create({
    data: {
      userId,
      hash: hashToken(refreshToken),
      deviceId,
      expiresAt
    }
  });
}
async function validarSessao(refreshToken) {
  const session = await client_default.session.findFirst({
    where: {
      hash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: /* @__PURE__ */ new Date() }
    },
    include: {
      user: { select: { id: true, email: true } }
    }
  });
  return session;
}
async function revogarSessao(refreshToken) {
  return client_default.session.updateMany({
    where: { hash: hashToken(refreshToken) },
    data: { revokedAt: /* @__PURE__ */ new Date() }
  });
}

// src/modules/auth/auth.routes.ts
async function authRoutes(app2) {
  app2.post(
    "/register",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute", ban: 3e5 } } },
    async (req, res) => {
      const parsed = RegisterBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send({ error: "Dados inv\xE1lidos", details: parsed.error.errors });
      }
      try {
        const user = await registrarUsuario(parsed.data.email, parsed.data.password);
        return res.status(201).send(user);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro interno";
        return res.status(409).send({ error: message });
      }
    }
  );
  app2.post(
    "/login",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute", ban: 3e5 } } },
    async (req, res) => {
      const parsed = LoginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send({ error: "Dados inv\xE1lidos" });
      }
      try {
        const user = await autenticarUsuario(parsed.data.email, parsed.data.password);
        const accessToken = app2.jwt.sign({ userId: user.id, email: user.email });
        const refreshToken = gerarRefreshToken();
        const deviceId = req.headers["x-device-id"] || "unknown";
        await salvarSessao(user.id, refreshToken, deviceId);
        res.setCookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1e3,
          // 7 dias em ms
          path: "/api/v1/auth/refresh"
        });
        return { accessToken, user: { id: user.id, email: user.email } };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro interno";
        return res.status(401).send({ error: message });
      }
    }
  );
  app2.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).send({ error: "Refresh token n\xE3o encontrado" });
    }
    const session = await validarSessao(refreshToken);
    if (!session) {
      return res.status(401).send({ error: "Refresh token inv\xE1lido ou expirado" });
    }
    const accessToken = app2.jwt.sign({
      userId: session.user.id,
      email: session.user.email
    });
    return { accessToken };
  });
  app2.post("/logout", async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await revogarSessao(refreshToken);
    }
    res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
    return { message: "Logout realizado" };
  });
}

// src/plugins/prisma.plugin.ts
import fp from "fastify-plugin";
var prismaPlugin = fp(async (app2) => {
  app2.decorate("prisma", client_default);
});

// src/app.ts
function buildApp() {
  const app2 = Fastify({
    logger: process.env.NODE_ENV !== "production"
  });
  void app2.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
    credentials: true
  });
  void app2.register(helmet);
  void app2.register(cookie);
  void app2.register(prismaPlugin);
  void app2.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
    sign: {
      expiresIn: Number(process.env.JWT_ACCESS_TTL) || 900
    }
  });
  void app2.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });
  app2.get("/health", () => ({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
  app2.get("/api/v1", () => ({
    message: "DevNote API",
    version: "0.1.0"
  }));
  void app2.register(authRoutes, { prefix: "/api/v1/auth" });
  return app2;
}

// src/serverless.ts
var app = buildApp();
var readyPromise = app.ready();
async function handler(req, res) {
  await readyPromise;
  app.server.emit("request", req, res);
}
export {
  handler as default
};
