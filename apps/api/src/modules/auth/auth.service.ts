import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import prisma from "../../prisma/client.js";

const BCRYPT_COST = 12;

/**
 * Logica de negocio do auth.
 */

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, BCRYPT_COST);
}

export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function gerarRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export async function registrarUsuario(nome: string, email: string, senha: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email ja cadastrado");

  const senhaHash = await hashSenha(senha);

  return prisma.user.create({
    data: {
      name: nome,
      email,
      passwordHash: senhaHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function autenticarUsuario(email: string, senha: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) throw new Error("Credenciais invalidas");

  const valido = await compararSenha(senha, user.passwordHash);
  if (!valido) throw new Error("Credenciais invalidas");

  const { passwordHash: _omit, ...usuario } = user;
  return usuario;
}

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

export async function validarSessao(refreshToken: string) {
  return prisma.session.findFirst({
    where: {
      hash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function revogarSessao(refreshToken: string) {
  return prisma.session.updateMany({
    where: { hash: hashToken(refreshToken) },
    data: { revokedAt: new Date() },
  });
}
