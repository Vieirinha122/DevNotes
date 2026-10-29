import {
  type Note,
  type NoteQueryInput,
  type NotesListResponse,
  NotesListResponseSchema,
} from "@devnote/contracts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

/**
 * Query infinita de notas — fetch paginado com infinite scroll.
 * Cada página faz GET /notes?page=N&limit=20.
 *
 * TanStack cacheia por página e usa getNextPageParam pra saber
 * se tem mais (baseado no paginacao.temProximo da API).
 *
 * @param filtros - search, tag (page/limit são gerenciados internamente)
 */
export function useNotas(filtros?: Omit<NoteQueryInput, "page" | "limit">) {
  return useInfiniteQuery<NotesListResponse>({
    // key inclui filtros: cache invalida por escopo
    queryKey: ["notas", filtros ?? {}],
    // Página inicial — obrigatório no TQ v5
    initialPageParam: 1,
    // Informa pro React Query qual a próxima página baseado no response da API:
    // se temProximo=true, fetch página+1; se false, chegou ao fim
    getNextPageParam: (ultimaResposta) => {
      return ultimaResposta.paginacao.temProximo ? ultimaResposta.paginacao.pagina + 1 : undefined;
    },
    queryFn: async ({ pageParam }) => {
      const pagina = pageParam ?? 1;

      // Monta query params dinamicamente (só inclui filtros definidos)
      const params = new URLSearchParams({
        page: String(pagina),
        limit: "20",
        ...(filtros?.search && { search: filtros.search }),
        ...(filtros?.tag && { tag: filtros.tag }),
      });

      const response = await apiFetch(`/notes?${params}`);

      if (!response.ok) {
        throw new Error(`Erro ao buscar notas: ${response.status}`);
      }

      // Zod valida a resposta em runtime — protege contra divergence entre
      // o que o frontend espera e o que o backend manda de verdade
      const json = await response.json();
      const parsed = NotesListResponseSchema.safeParse(json);

      if (!parsed.success) {
        throw new Error("Schema da resposta da API divergiu do esperado");
      }

      return parsed.data;
    },
    // Stale rápido: notas mudam frequentemente
    staleTime: 60 * 1000,
    // Mantém a lista anterior na tela durante novas buscas, evitando piscada/loading de tela cheia
    placeholderData: (previousData) => previousData,
  });
}

// Re-exporta tipo das notas pra hooks de UI usarem
export type { Note };
