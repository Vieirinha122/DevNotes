import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../../prisma/client.js";

const BCRYPT_COST = 12;

/**
 * Lógica de negócio do auth — regras puras, sem side effects de HTTP.
 * Regra do vault: "Regra de negócio é sempre responsabilidade do backend."
 */

/** Hash de senha pro armazenamento no banco (bcrypt, cost 12). */
export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, BCRYPT_COST);
}

/** Verifica senha contra o hash armazenado. */
export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/** Hash de refresh token (sha256) — mais rápido que bcrypt pra tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Gera refresh token criptograficamente seguro. */
export function gerarRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

/** Registrar novo usuário: valida duplicata, hash de senha, persiste. */
export async function registrarUsuario(email: string, senha: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email já cadastrado");

  const senhaHash = await hashSenha(senha);
  return prisma.user.create({
    data: { email, passwordHash: senhaHash },
    select: { id: true, email: true, createdAt: true, updatedAt: true },
  });
}

/** Autenticar usuário: busca, verifica senha. Retorna o usuário ou erro. */
export async function autenticarUsuario(email: string, senha: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) throw new Error("Credenciais inválidas");

  const valido = await compararSenha(senha, user.passwordHash);
  if (!valido) throw new Error("Credenciais inválidas");

  // remove passwordHash do retorno
  const { passwordHash: _omit, ...usuario } = user;
  return usuario;
}

/** Salva session (refresh token hash) no banco. */
export async function salvarSessao(userId: string, refreshToken: string, deviceId: string) {
  const expiresAt = new Date(Date.now() + (Number(process.env.JWT_REFRESH_TTL) || 604800) * 1000);
  return prisma.session.create({
    data: {
      userId,
      hash: hashToken(refreshToken),
      deviceId,
      expiresAt,
    },
  });
}

/** Busca sessão válida (não revogada, não expirada) pelo refresh token. */
export async function validarSessao(refreshToken: string) {
  const session = await prisma.session.findFirst({
    where: {
      hash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });
  return session;
}

/** Revoga sessão (refresh token) no banco. */
export async function revogarSessao(refreshToken: string) {
  return prisma.session.updateMany({
    where: { hash: hashToken(refreshToken) },
    data: { revokedAt: new Date() },
  });
}
