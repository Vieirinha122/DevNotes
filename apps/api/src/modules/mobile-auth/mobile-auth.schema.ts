import { z } from "zod";

/**
 * Schemas Zod para validacao de entrada do mobile-auth.
 * Compartilhado entre backend e (futuramente) app mobile via packages/contracts.
 */

// Plataformas suportadas pra sessao mobile
export const PlatformSchema = z.enum(["web", "android", "ios"]);

export const MobileLoginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
  deviceId: z.string().min(1, "deviceId obrigatorio"),
  platform: PlatformSchema.default("android"),
});

export const MobileRefreshBodySchema = z.object({
  refreshToken: z.string().min(1, "refreshToken obrigatorio"),
});

export type MobileLoginInput = z.infer<typeof MobileLoginBodySchema>;
export type MobileRefreshInput = z.infer<typeof MobileRefreshBodySchema>;
