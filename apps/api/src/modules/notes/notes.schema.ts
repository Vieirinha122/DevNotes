import { z } from "zod";

/**
 * Schemas Zod para validacao de entrada do modulo notes.
 * Validacao acontece na borda (controller/routes) antes de chegar na service.
 * Regra do vault: "Validacao de toda entrada nas bordas com Zod".
 */

export const NoteKindSchema = z.enum(["NOTE", "CHECKLIST", "SNIPPET", "SOLUTION"]);

function normalizarTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

const TagsSchema = z.array(z.string().trim().min(1, "Tag invalida")).transform(normalizarTags);

const BooleanQuerySchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }

    return value;
  },
  z.boolean({ invalid_type_error: "pinned deve ser true ou false" }),
);

/**
 * Schema para criacao de nota.
 * O `id` e UUID gerado no cliente (offline-first, conforme schema.prisma).
 */
export const CreateNoteSchema = z.object({
  id: z.string().uuid("ID da nota invalido"),
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200, "Titulo muito longo"),
  content: z.string().default(""),
  tags: TagsSchema.default([]),
  kind: NoteKindSchema.optional().default("NOTE"),
  isPinned: z.boolean().default(false),
});

/**
 * Schema para atualizacao de nota (PUT/PATCH).
 * Todos os campos sao opcionais - atualizacao parcial suportada.
 */
export const UpdateNoteSchema = z.object({
  title: z.string().trim().min(1, "Titulo obrigatorio").max(200, "Titulo muito longo").optional(),
  content: z.string().optional(),
  tags: TagsSchema.optional(),
  isPinned: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

/**
 * Schema para query params da listagem de notas.
 * Inclui paginacao, busca por texto e filtros.
 */
export const NoteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().optional(),
  pinned: BooleanQuerySchema.optional(),
  tag: z.string().trim().optional(),
});

/**
 * Schema para validacao do id de nota vindo da URL.
 */
export const NoteIdSchema = z.object({
  id: z.string().uuid("ID da nota invalido"),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type NoteQueryInput = z.infer<typeof NoteQuerySchema>;
export type NoteIdInput = z.infer<typeof NoteIdSchema>;
