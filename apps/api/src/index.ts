import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { request, type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { authRoutes } from "./modules/auth/auth.routes";

export const app: Express = express();

// Middlewares de segurança e parse
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Rate limit global (100 requisições por minuto)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rotas de status e health check
app.get("/", (request, response) => {
  response.status(200).send("Rodando");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1", (_req, res) => {
  res.status(200).json({
    message: "DevNote API",
    version: "0.1.0",
  });
});

// Módulo de autenticação
app.use("/api/v1/auth", authRoutes);

// Inicia o servidor HTTP para desenvolvimento local (fora do ambiente serverless)
if (process.env.VERCEL !== "1") {
  const porta = Number(process.env.PORT) || 4000;
  const host = process.env.HOST ?? "0.0.0.0";

  app.listen(porta, host, () => {
    console.log(`API rodando em http://${host}:${porta}`);
  });
}

export default app;
