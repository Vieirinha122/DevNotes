import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

/**
 * Entry point Vercel Serverless — autossuficiente.
 *
 * - Sem imports de ../src/ (evita erro de resolução ESM no runtime)
 * - Usa app.server.emit("request") em vez de app.inject()
 *   (evita conflito ESM/CJS do light-my-request com cookie@2)
 * - Framework Preset DEVE ser "Other" no dashboard da Vercel
 */

const app = Fastify({ logger: false });

void app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
});
void app.register(helmet);

// Rota raiz
app.get("/", () => ({
  status: "ok",
  message: "DevNote API — online",
  version: "0.0.0",
  timestamp: new Date().toISOString(),
}));

// Health check
app.get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

// Hello world da API
app.get("/api/v1", () => ({
  message: "DevNote API — casca rodando",
  version: "0.0.0",
}));

const readyPromise = app.ready();

// Handler serverless — Vercel invoca esta função para cada request
export default async function handler(req: any, res: any) {
  await readyPromise;
  app.server.emit("request", req, res);
}
