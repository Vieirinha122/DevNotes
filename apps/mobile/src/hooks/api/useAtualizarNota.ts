import { type UpdateNoteRequest, UpdateNoteRequestSchema } from "@devnote/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { Note } from "./useNotas";

interface AtualizarNotaProps {
  id: string;
  titulo?: string;
  conteudo?: string;
  tags?: string[];
  isPinned?: boolean;
  version?: number;
}

/**
 * Mutation pra atualizar nota (PUT /notes/:id).
 * Só envia campos definidos — PATCH semipreco sobreposto.
 *
 * O `version` vem do objeto original pra concurrency otimista:
 * se o backend detectar conflito, retorna 409.
 *
 * onSuccess invalida o cache da nota específica + lista.
 */
export function useAtualizarNota() {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, AtualizarNotaProps>({
    mutationFn: async (props) => {
      // Monta payload só com campos definidos (partial update)
      const payload: UpdateNoteRequest = {
        ...(props.titulo && { title: props.titulo.trim() }),
        ...(props.conteudo !== undefined && { content: props.conteudo }),
        ...(props.tags !== undefined && { tags: props.tags }),
        ...(props.isPinned !== undefined && { isPinned: props.isPinned }),
        ...(props.version !== undefined && { version: props.version }),
      };

      const parsed = UpdateNoteRequestSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(`Payload inválido: ${parsed.error.errors[0]?.message}`);
      }

      const response = await apiFetch(`/notes/${props.id}`, {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        // 409 = conflito de versão (nota modificada por outro cliente)
        if (response.status === 409) {
          throw new Error("Nota foi modificada por outro cliente. Recarrregue e tente novamente.");
        }

        throw new Error(`Erro ao atualizar nota: ${response.status}`);
      }

      // Backend retorna { nota, conflito } quando não há conflito
      const json = await response.json();
      return json as Note;
    },
    onSuccess: (notaAtualizada) => {
      // Invalida nota específica + lista inteira
      queryClient.invalidateQueries({ queryKey: ["nota", notaAtualizada.id] });
      queryClient.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}
