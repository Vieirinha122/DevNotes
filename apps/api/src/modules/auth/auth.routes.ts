import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { LoginBodySchema, RegisterBodySchema } from "./auth.schema";
import {
  autenticarUsuario,
  gerarRefreshToken,
  registrarUsuario,
  revogarSessao,
  salvarSessao,
  validarSessao,
} from "./auth.service";

/**
 * Rotas de autenticação (Express Router):
 * - POST /register
 * - POST /login
 * - POST /refresh
 * - POST /logout
 */
export const authRoutes: Router = Router();

// Configurações do token JWT
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const JWT_EXPIRES_IN = Number(process.env.JWT_ACCESS_TTL) || 900;

// Rate limit mais restritivo para proteção contra brute force (5 req/min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em 1 minuto." },
});

// Cadastro de usuário
authRoutes.post("/register", authLimiter, async (req, res) => {
  const parsed = RegisterBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos", details: parsed.error.errors });
  }

  try {
    const user = await registrarUsuario(parsed.data.email, parsed.data.password);
    return res.status(201).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(409).json({ error: message });
  }
});

// Login com email e senha
authRoutes.post("/login", authLimiter, async (req, res) => {
  const parsed = LoginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const user = await autenticarUsuario(parsed.data.email, parsed.data.password);

    // Gera o Access Token JWT curto (15 minutos)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // Gera o Refresh Token aleatório e persiste na sessão
    const refreshToken = gerarRefreshToken();
    const deviceId = (req.headers["x-device-id"] as string) || "unknown";
    await salvarSessao(user.id, refreshToken, deviceId);

    // Grava o refresh token em cookie seguro HttpOnly
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: "/api/v1/auth/refresh",
    });

    return res.status(200).json({
      accessToken,
      user: { id: user.id, email: user.email },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(401).json({ error: message });
  }
});

// Renovação de access token via cookie HttpOnly
authRoutes.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token não encontrado" });
  }

  const session = await validarSessao(refreshToken);
  if (!session) {
    return res.status(401).json({ error: "Refresh token inválido ou expirado" });
  }

  // Gera novo Access Token
  const accessToken = jwt.sign(
    { userId: session.user.id, email: session.user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  return res.status(200).json({ accessToken });
});

// Encerramento de sessão (logout)
authRoutes.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await revogarSessao(refreshToken);
  }

  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
  return res.status(200).json({ message: "Logout realizado" });
});
