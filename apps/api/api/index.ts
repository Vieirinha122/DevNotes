/**
 * Entry point para Vercel Serverless Functions.
 * Exporta o handler do Fastify via @fastify/aws-lambda (compatível com AWS Lambda/Vercel).
 *
 * O index.ts (dev) faz app.listen(); este aqui exporta app pronta pra serverless.
 */

import { awsLambdaFastify } from "@fastify/aws-lambda";
import { buildApp } from "../src/app";

const app = buildApp();

// Pre-warming: garante que plugins e rotas estão prontos antes do primeiro request
void app.ready();

// Handler serverless — Vercel invoca isso pra cada request
export default awsLambdaFastify(app);
