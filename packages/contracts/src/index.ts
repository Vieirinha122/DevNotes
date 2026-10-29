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

// ─── Notes (compartilhado mobile + web) ───

/**
 * Tipos de nota suportados pelo DevNote.
 * @see prisma/schema.prisma → field `kind`
 */
export const NoteKindSchema = z.enum(["NOTE", "CHECKLIST", "SNIPPET", "SOLUTION"]);

/**
 * Shape de uma nota como retornado pela API (formatado pelo backend).
 * Tags vêm como array de strings prontas (names extraídos).
 */
export const NoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string(),
  tags: z.array(z.string()),
  isPinned: z.boolean(),
  kind: NoteKindSchema,
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Note = z.infer<typeof NoteSchema>;

/**
 * Parametros de query pra listagem paginada.
 * `pinned`/`search`/`tag` sao opcionais — usados pra filtrar.
 */
export const NoteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().optional(),
  pinned: z.boolean().optional(),
  tag: z.string().trim().optional(),
});

export type NoteQueryInput = z.infer<typeof NoteQuerySchema>;

/**
 * Paginacao retornada junto com a lista de notas.
 */
export const PaginacaoSchema = z.object({
  pagina: z.number().int().min(1),
  porPagina: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPaginas: z.number().int().min(0),
  temProximo: z.boolean(),
  temAnterior: z.boolean(),
});

/**
 * Response do GET /notes — notas + metadados de paginacao.
 */
export const NotesListResponseSchema = z.object({
  notas: z.array(NoteSchema),
  paginacao: PaginacaoSchema,
});

export type NotesListResponse = z.infer<typeof NotesListResponseSchema>;

/**
 * Payload pra POST /notes — cria nova nota.
 * O `id` e UUID gerado no cliente (offline-first).
 */
export const CreateNoteRequestSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200),
  content: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  kind: NoteKindSchema.optional(),
  isPinned: z.boolean().optional(),
});

export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;

/**
 * Payload pra PUT/PATCH /notes/:id — todos os campos sao opcionais
 * (atualizacao parcial). `version` e pra concurrency otimista.
 */
export const UpdateNoteRequestSchema = z.object({
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  isPinned: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export type UpdateNoteRequest = z.infer<typeof UpdateNoteRequestSchema>;

export const version = "0.1.0";
