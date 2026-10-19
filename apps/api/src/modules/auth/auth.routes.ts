import type { FastifyInstance } from "fastify";
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
 * Rotas de autenticação: POST /register, /login, /refresh, /logout.
 * Registradas com prefix /api/v1/auth pelo app.ts.
 *
 * Segurança aplicada:
 * - Zod valida toda entrada (body)
 * - Rate-limit mais restritivo (5/min) nessas rotas sensíveis
 * - Refresh token em cookie HttpOnly + Secure + SameSite
 * - Access token exposto no body (curto: 15min)
 */
export async function authRoutes(app: FastifyInstance) {
  // Register — rate-limit restritivo (brute-force/abuse de sign-up)
  app.post(
    "/register",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute", ban: 300000 } } },
    async (req, res) => {
      const parsed = RegisterBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send({ error: "Dados inválidos", details: parsed.error.errors });
      }
      try {
        const user = await registrarUsuario(parsed.data.email, parsed.data.password);
        return res.status(201).send(user);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro interno";
        return res.status(409).send({ error: message });
      }
    },
  );

  // Login — rate-limit restritivo (brute-force protection: 5/min, ban 5min)
  app.post(
    "/login",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute", ban: 300000 } } },
    async (req, res) => {
      const parsed = LoginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).send({ error: "Dados inválidos" });
      }
      try {
        const user = await autenticarUsuario(parsed.data.email, parsed.data.password);

        // Access token (JWT, 15min) — retornado no body, usado em memória pelo front
        const accessToken = app.jwt.sign({ userId: user.id, email: user.email });
        // Refresh token (aleatório, hash no banco) — cookie HttpOnly
        const refreshToken = gerarRefreshToken();

        const deviceId = (req.headers["x-device-id"] as string) || "unknown";
        await salvarSessao(user.id, refreshToken, deviceId);

        res.setCookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
          path: "/api/v1/auth/refresh",
        });

        return { accessToken, user: { id: user.id, email: user.email } };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro interno";
        return res.status(401).send({ error: message });
      }
    },
  );

  // Refresh — gera novo access token usando o refresh token do cookie
  app.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).send({ error: "Refresh token não encontrado" });
    }

    const session = await validarSessao(refreshToken);
    if (!session) {
      return res.status(401).send({ error: "Refresh token inválido ou expirado" });
    }

    const accessToken = app.jwt.sign({
      userId: session.user.id,
      email: session.user.email,
    });
    return { accessToken };
  });

  // Logout — revoga a sessão e limpa o cookie
  app.post("/logout", async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await revogarSessao(refreshToken);
    }
    res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
    return { message: "Logout realizado" };
  });
}
