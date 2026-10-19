import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

/**
 * Entry point Vercel Serverless — autossuficiente.
 *
 * O Fastify é configurado aqui dentro para evitar imports relativos
 * (../src/app) que quebram no ESM do runtime da Vercel.
 * Quando o projeto crescer e tiver rotas reais, migramos para
 * um bundler (esbuild/tsup) que gera um único arquivo.
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

  // Coleta body para POST/PUT/PATCH
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks).toString();
    if (raw.length > 0) body = raw;
  }

  // Injeta requisição no Fastify sem servidor HTTP real
  const response = await app.inject({
    method: req.method,
    url: req.url || "/",
    headers: req.headers,
    payload: body,
  });

  // Copia resposta do Fastify para a resposta da Vercel
  res.statusCode = response.statusCode;
  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      res.setHeader(key, value as string);
    }
  }
  res.end(response.body);
}
