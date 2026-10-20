/**
 * Augmentacao de tipos do Express: adiciona `req.user` apos o middleware
 * de autenticacao injetar os dados do token JWT.
 * Aplicado globalmente via `declare module` (arquivo .d.ts carregado pelo tsc).
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email: string;
    };
  }
}

export {};
