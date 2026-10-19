import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "./app";

/**
 * Entry point Vercel Serverless.
 * Este arquivo é empacotado pelo esbuild para gerar `api/index.js`.
 */
const app = buildApp();
const readyPromise = app.ready();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await readyPromise;
  app.server.emit("request", req, res);
}
