import { type CreateNoteRequest, CreateNoteRequestSchema } from "@devnote/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { gerarUuidV4 } from "@/utils/uuid";
import type { Note } from "./useNotas";

interface CriarNotaProps {
  titulo: string;
  conteudo?: string;
  tags?: string[];
  kind?: "NOTE" | "CHECKLIST" | "SNIPPET" | "SOLUTION";
  fixada?: boolean;
}

/**
 * Mutation pra criar uma nova nota.
 * Gera UUID v4 client-side (offline-first) e envia via POST /notes.
 *
 * onSuccess invalida o cache de notas pra trigger refetch automática.
 */
export function useCriarNota() {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, CriarNotaProps>({
    mutationFn: async (props) => {
      // Gera UUID v4 compatível com React Native / Hermes (offline-first)
      const payload: CreateNoteRequest = {
        id: gerarUuidV4(),
        title: props.titulo.trim(),
        content: props.conteudo ?? "",
        tags: props.tags ?? [],
        kind: props.kind ?? "NOTE",
        isPinned: props.fixada ?? false,
      };

      // Valida payload com Zod antes de enviar (fail fast no cliente)
      const parsed = CreateNoteRequestSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(`Payload inválido: ${parsed.error.errors[0]?.message}`);
      }

      const response = await apiFetch("/notes", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar nota: ${response.status}`);
      }

      const json = await response.json();
      return json as Note;
    },
    // Invalida cache pra refetch automática da lista
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}
