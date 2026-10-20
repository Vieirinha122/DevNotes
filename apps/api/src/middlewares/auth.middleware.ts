import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

/**
 * Middleware de autenticação: verifica o token JWT de acesso enviado no
 * header Authorization (Bearer token) e injeta `req.user` com userId e email.
 *
 * Regra do vault (seguranca-backend.md):
 * - Access token de vida curta (15 min), enviado no header.Authorization
 * - tenant_id / userId sempre lido do contexto autenticado, nunca do payload do cliente
 *
 * Proteja rotas que manipulam dados do usuário com este middleware.
 */
export function autenticar(request: Request, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  // Extrai o token do header "Bearer <token>"
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  if (!token) {
    return response.status(401).json({ error: "Token de acesso não informado" });
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Injeta os dados do usuário autenticado no request
    request.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (_err) {
    // Token inválido ou expirado
    return response.status(401).json({ error: "Token de acesso inválido ou expirado" });
  }
}
