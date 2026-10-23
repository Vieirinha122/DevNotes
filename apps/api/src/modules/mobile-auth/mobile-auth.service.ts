import jwt from "jsonwebtoken";
import {
  autenticarUsuario,
  gerarRefreshToken,
  revogarSessao,
  salvarSessao,
  validarSessao,
} from "../auth/auth.service.js";
import type { MobileLoginInput, MobileRefreshInput } from "./mobile-auth.schema.js";

/**
 * Service de auth mobile.
 * Diverge do web auth porque:
 * - nao usa cookie (retorna tokens diretamente no body)
 * - registra platform e deviceId na sessao
 * - usa refresh token como Bearer (header Authorization)
 */

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const JWT_EXPIRES_IN = Number(process.env.JWT_ACCESS_TTL) || 900; // 15 min default

/**
 * Login mobile: autentica usuario, gera access + refresh tokens.
 * O refresh token e hasheado antes de salvar no banco (SHA256).
 */
export async function loginMobile(dados: MobileLoginInput) {
  const { email, password, deviceId, platform } = dados;

  // Reusa a auth do web (bcrypt, email normalization)
  const user = await autenticarUsuario(email, password);

  const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = gerarRefreshToken();
  await salvarSessao(user.id, refreshToken, deviceId, platform);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

/**
 * Renova access token usando o refresh token enviado no body.
 * Nao usa cookie — o app mobile envia o refresh token no header Authorization.
 */
export async function refreshMobile(refreshToken: string) {
  const session = await validarSessao(refreshToken);
  if (!session) {
    throw new Error("Refresh token invalido ou expirado");
  }

  const accessToken = jwt.sign({ userId: session.user.id, email: session.user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    accessToken,
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
  };
}

/**
 * Logout mobile: revoga o refresh token no banco.
 */
export async function logoutMobile(refreshToken: string) {
  await revogarSessao(refreshToken);
}
