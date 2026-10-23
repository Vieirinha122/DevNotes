import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  autenticarUsuario,
  gerarRefreshToken,
  revogarSessao,
  salvarSessao,
  validarSessao,
} from "../auth/auth.service.js";
import { MobileLoginBodySchema, MobileRefreshBodySchema } from "./mobile-auth.schema.js";

/**
 * Rotas de auth mobile (Express Router):
 * - POST /api/v1/mobile-auth/login   -> retorna accessToken + refreshToken (nao usa cookie)
 * - POST /api/v1/mobile-auth/refresh -> renova access token via refreshToken no body
 * - POST /api/v1/mobile-auth/logout  -> revoga refresh token
 *
 * Diverge do web auth porque:
 * - nao usa cookie httpOnly (mobile nao confia cookie cross-app)
 * - registra deviceId e platform na sessao
 */
export const mobileAuthRoutes: Router = Router();

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const JWT_EXPIRES_IN = Number(process.env.JWT_ACCESS_TTL) || 900;

/**
 * Registra device e platform, autentica usuario, gera tokens.
 * O refresh token e salvo hasheado (SHA256) no banco.
 */
mobileAuthRoutes.post("/login", async (req, res) => {
  const parsed = MobileLoginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.errors });
  }

  try {
    // Reusa a auth do web (bcrypt, email normalization)
    const user = await autenticarUsuario(parsed.data.email, parsed.data.password);

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = gerarRefreshToken();
    const deviceId = parsed.data.deviceId;
    const platform = parsed.data.platform;

    await salvarSessao(user.id, refreshToken, deviceId, platform);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(401).json({ error: message });
  }
});

/**
 * Renova access token usando refresh token enviado no body.
 * Valida o hash no banco (nao valida JWT de acesso).
 */
mobileAuthRoutes.post("/refresh", async (req, res) => {
  const parsed = MobileRefreshBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "refreshToken obrigatorio" });
  }

  try {
    const session = await validarSessao(parsed.data.refreshToken);
    if (!session) {
      return res.status(401).json({ error: "Refresh token invalido ou expirado" });
    }

    const accessToken = jwt.sign(
      { userId: session.user.id, email: session.user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.status(200).json({
      accessToken,
      user: { id: session.user.id, name: session.user.name, email: session.user.email },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(500).json({ error: message });
  }
});

/**
 * Logout mobile: revoga o refresh token no banco.
 */
mobileAuthRoutes.post("/logout", async (req, res) => {
  const parsed = MobileRefreshBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "refreshToken obrigatorio" });
  }

  await revogarSessao(parsed.data.refreshToken);
  return res.status(200).json({ message: "Logout realizado" });
});
