import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app";

/**
 * Entry point Vercel Serverless.
 *
 * - Importa buildApp() de src/app (mesmos plugins + routes do dev)
 * - Usa app.server.emit("request") em vez de app.inject()
 *   (compatível com Vercel Functions sem awsLambdaFastify)
 * - @vercel/node (esbuild) resolve imports relativos normalmente
 *
 * Nota: o Prisma Client usa DATABASE_URL (pooler) em runtime.
 * migrations rodam localmente via prisma db push.
 */

const app = buildApp();
const readyPromise = app.ready();

// Handler serverless — Vercel invoca esta função para cada request
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await readyPromise;
  app.server.emit("request", req, res);
}
