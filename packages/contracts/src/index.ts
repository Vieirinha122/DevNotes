import { z } from "zod";

/**
 * Schemas Zod compartilhados entre frontend e backend.
 * Definem a validação de entrada/saída (DTOs) em um único lugar.
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

export const version = "0.1.0";
