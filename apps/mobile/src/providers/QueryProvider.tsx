import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * QueryClient configurado pro mobile:
 * - staleTime 5min: evita refetch excessivo enquanto o usuário navega
 * - gcTime 10min: mantém cache de notas por 10 min após a tela perder foco
 * - retry 1x, só pra falhas de rede (não pra 401/auth)
 * - retryDelay exponencial (1s → 2s → 4s, cap 30s)
 *
 * Singleton: criado fora do componente pra não recriar entre renders.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000 * 5, // 5 minutos
      gcTime: 60 * 1000 * 10, // 10 minutos
      retry: (failureCount, error) => {
        // retry só se for Network/Timeout (TypeError no RN fetch)
        if (error instanceof TypeError) {
          return failureCount < 1;
        }
        return false;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});

/**
 * Provider de TanStack Query pra toda a árvore do app.
 * Envolvimento no RootLayout (src/app/_layout.tsx).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
