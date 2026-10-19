import { buildApp } from "./app";

// Inicia o servidor HTTP (entry point para desenvolvimento)
const app = buildApp();

const porta = Number(process.env.PORT) || 4000;
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port: porta, host });
  app.log.info(`API rodando em http://${host}:${porta}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
