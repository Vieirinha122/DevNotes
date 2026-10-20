import { z } from "zod";

/**
 * Schemas Zod compartilhados entre frontend e backend.
 * Definem a validacao de entrada/saida (DTOs) em um unico lugar.
 */
export const RegisterBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome precisa ter pelo menos 2 caracteres")
    .max(120, "Nome muito longo"),
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z
    .string()
    .min(8, "Senha precisa de pelo menos 8 caracteres")
    .max(128, "Senha muito longa"),
});

export const LoginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
});

export type RegisterInput = z.infer<typeof RegisterBodySchema>;
export type LoginInput = z.infer<typeof LoginBodySchema>;

export const version = "0.1.0";
