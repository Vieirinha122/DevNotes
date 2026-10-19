import { buildApp } from "../src/app";

/**
 * Entry point para Vercel Serverless Functions.
 *
 * Usa app.inject() do Fastify, que simula uma requisição HTTP internamente
 * sem precisar de um servidor HTTP real rodando (app.listen).
 * Isso é a forma mais confiável de rodar Fastify em ambiente serverless.
 */

const app = buildApp();
const readyPromise = app.ready();

export default async function handler(req: any, res: any) {
  await readyPromise;

  // Coleta o body da requisição para métodos que enviam payload
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks).toString();
    if (raw.length > 0) body = raw;
  }

  // Injeta a requisição direto no pipeline do Fastify (sem servidor HTTP real)
  const response = await app.inject({
    method: req.method,
    url: req.url || "/",
    headers: req.headers,
    payload: body,
  });

  // Copia a resposta do Fastify para a resposta da Vercel
  res.statusCode = response.statusCode;
  for (const [key, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      res.setHeader(key, value as string);
    }
  }
  res.end(response.body);
}
