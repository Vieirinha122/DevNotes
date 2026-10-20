import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { LoginBodySchema, RegisterBodySchema } from "./auth.schema.js";
import {
  autenticarUsuario,
  gerarRefreshToken,
  registrarUsuario,
  revogarSessao,
  salvarSessao,
  validarSessao,
} from "./auth.service.js";

export const authRoutes: Router = Router();

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const JWT_EXPIRES_IN = Number(process.env.JWT_ACCESS_TTL) || 900;

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: { error: "Muitas tentativas. Tente novamente em 1 minuto." },
});

authRoutes.post("/register", authLimiter, async (req, res) => {
  const parsed = RegisterBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.errors });
  }

  try {
    const user = await registrarUsuario(parsed.data.name, parsed.data.email, parsed.data.password);
    return res.status(201).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(409).json({ error: message });
  }
});

authRoutes.post("/login", authLimiter, async (req, res) => {
  const parsed = LoginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos" });
  }

  try {
    const user = await autenticarUsuario(parsed.data.email, parsed.data.password);

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = gerarRefreshToken();
    const deviceId = (req.headers["x-device-id"] as string) || "unknown";
    await salvarSessao(user.id, refreshToken, deviceId);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth/refresh",
    });

    return res.status(200).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(401).json({ error: message });
  }
});

authRoutes.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token nao encontrado" });
  }

  const session = await validarSessao(refreshToken);
  if (!session) {
    return res.status(401).json({ error: "Refresh token invalido ou expirado" });
  }

  const accessToken = jwt.sign({ userId: session.user.id, email: session.user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return res.status(200).json({
    accessToken,
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
  });
});

authRoutes.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await revogarSessao(refreshToken);
  }

  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
  return res.status(200).json({ message: "Logout realizado" });
});
