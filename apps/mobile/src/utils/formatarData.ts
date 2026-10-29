/**
 * Formata timestamps pra exibição relativa: "Hoje, 14:32" / "Ontem, 16:08".
 *
 * Fuso horário fixo em America/Sao_Paulo (backend envia em UTC),
 * evitando o bug onde `new Date("...Z")` renderiza como 00:00 local.
 *
 * Compartilhado entre NoteCard (lista) e FormularioNota (editor).
 */
export function formatarTimestamp(dataISO: string): string {
  const d = new Date(dataISO);
  const optsFuso = { timeZone: "America/Sao_Paulo" } as const;

  const dataStr = d.toLocaleDateString("pt-BR", {
    ...optsFuso,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hoje = new Date();
  const hojeStr = hoje.toLocaleDateString("pt-BR", optsFuso);
  const ontem = new Date(hoje.getTime() - 86_400_000);
  const ontemStr = ontem.toLocaleDateString("pt-BR", optsFuso);

  const hora = d.toLocaleTimeString("pt-BR", {
    ...optsFuso,
    hour: "2-digit",
    minute: "2-digit",
  });

  if (dataStr === hojeStr) return `Hoje, ${hora}`;
  if (dataStr === ontemStr) return `Ontem, ${hora}`;
  return `${dataStr} às ${hora}`;
}
