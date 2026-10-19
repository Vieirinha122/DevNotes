import { z } from "zod";

/**
 * Schemas Zod para validação de entrada do módulo auth.
 * Validação acontece na borda (controller) antes de chegar na service.
 * Regra do vault: "Validação de toda entrada nas bordas com Zod".
 */

export const RegisterBodySchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Senha precisa de pelo menos 8 caracteres")
    .max(128, "Senha muito longa"),
});

export const LoginBodySchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type RegisterInput = z.infer<typeof RegisterBodySchema>;
export type LoginInput = z.infer<typeof LoginBodySchema>;
