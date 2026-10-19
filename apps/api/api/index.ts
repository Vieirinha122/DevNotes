import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";

/**
 * Entry point para Vercel Serverless Functions.
 * Usa o handler nativo HTTP do Node (app.server.emit) em vez de adaptadores AWS Lambda,
 * garantindo compatibilidade total com o runtime da Vercel (IncomingMessage e ServerResponse).
 */
let appInstance: FastifyInstance | null = null;

async function getApp(): Promise<FastifyInstance> {
  if (!appInstance) {
    appInstance = buildApp();
    await appInstance.ready();
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  app.server.emit("request", req, res);
}
