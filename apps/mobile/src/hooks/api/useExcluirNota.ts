import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

interface ExcluirNotaProps {
  id: string;
  version: number;
}

/**
 * Mutation pra excluir nota (soft delete via DELETE /notes/:id).
 * O backend marca `deletedAt` sem remover do banco — recuperável.
 *
 * onSuccess invalida cache da nota + lista pra refletir remoção.
 */
export function useExcluirNota() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, ExcluirNotaProps>({
    mutationFn: async ({ id }) => {
      const response = await apiFetch(`/notes/${id}`, {
        method: "DELETE",
      });

      // 204 No Content = sucesso
      if (!response.ok) {
        throw new Error(`Erro ao excluir nota: ${response.status}`);
      }

      return true;
    },
    onSuccess: () => {
      // Remove da cache pra UI atualizar instantaneamente
      queryClient.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}
