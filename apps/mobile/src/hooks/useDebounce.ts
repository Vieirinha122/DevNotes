import { useEffect, useState } from "react";

/**
 * Hook para debouncing de valores com delay configurável.
 *
 * Evita disparos excessivos de requisições de busca a cada tecla digitada,
 * aguardando o usuário pausar a digitação pelo intervalo informado.
 *
 * @param valor - Valor a ser postergado (ex: texto do input de busca)
 * @param delayMs - Tempo de espera em milissegundos (default: 350ms)
 */
export function useDebounce<T>(valor: T, delayMs: number = 350): T {
  const [valorDebounced, setValorDebounced] = useState<T>(valor);

  useEffect(() => {
    const timer = setTimeout(() => {
      setValorDebounced(valor);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [valor, delayMs]);

  return valorDebounced;
}

