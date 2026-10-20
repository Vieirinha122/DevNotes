const BRASILIA_TIMEZONE = "America/Sao_Paulo";

function parseIsoDate(isoDate: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function resolveActivityDate(createdAt: string, updatedAt: string) {
  const createdDate = parseIsoDate(createdAt);
  const updatedDate = parseIsoDate(updatedAt);

  if (!createdDate && !updatedDate) {
    return {
      date: null,
      label: "Data indisponivel",
      wasUpdated: false,
    };
  }

  if (!createdDate) {
    return {
      date: updatedDate,
      label: "Atualizada",
      wasUpdated: true,
    };
  }

  if (!updatedDate) {
    return {
      date: createdDate,
      label: "Criada",
      wasUpdated: false,
    };
  }

  const wasUpdated = updatedDate.getTime() !== createdDate.getTime();

  return {
    date: wasUpdated ? updatedDate : createdDate,
    label: wasUpdated ? "Atualizada" : "Criada",
    wasUpdated,
  };
}

export function formatNoteListTimestamp(createdAt: string, updatedAt: string) {
  const { date } = resolveActivityDate(createdAt, updatedAt);

  if (!date) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNoteWorkspaceTimestamp(createdAt: string, updatedAt: string) {
  const { date, label, wasUpdated } = resolveActivityDate(createdAt, updatedAt);

  if (!date) {
    return label;
  }

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${wasUpdated ? "Atualizada" : "Criada"} em ${formattedDate}`;
}

/**
 * Alterna o estado de um checklist markdown no índice ordinal `taskIndex` (0-based).
 * Suporta `- [ ]`, `- [x]`, `- [X]` e também `- []` (sem espaço).
 */
export function toggleMarkdownCheckbox(content: string, taskIndex: number): string {
  let currentTask = 0;
  return content.replace(
    /^(\s*(?:[-*+]|\d+\.)\s+\[)([ xX]?)(\])/gm,
    (match, prefix, checkState, suffix) => {
      if (currentTask === taskIndex) {
        currentTask++;
        const isChecked = checkState.toLowerCase() === "x";
        const newCheck = isChecked ? " " : "x";
        return `${prefix}${newCheck}${suffix}`;
      }
      currentTask++;
      return match;
    },
  );
}

/**
 * Normaliza o markdown para renderização:
 * 1. Converte `- []` sem espaço em `- [ ]` para ser reconhecido pelo parser GFM.
 * 2. Evita o "lazy continuation" do CommonMark: se uma linha que NÃO é item de lista
 *    vier imediatamente após um item de lista, adiciona uma linha em branco para que
 *    negrito, itálico ou parágrafos fiquem em sua própria linha em vez de colar no item anterior.
 */
export function formatMarkdownForPreview(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.split("\n");
  const result: string[] = [];

  const isListItem = (line: string) => /^\s*(?:[-*+]|\d+\.)\s+/.test(line);

  for (let i = 0; i < lines.length; i++) {
    let curr = lines[i];

    // Normaliza `- [] ` para `- [ ] `
    curr = curr.replace(/^(\s*[-*+]\s+)\[\](\s+.*|$)/, "$1[ ]$2");

    const prev = lines[i - 1];

    if (i > 0 && isListItem(prev) && curr.trim() !== "" && !isListItem(curr)) {
      result.push("");
    }

    result.push(curr);
  }

  return result.join("\n");
}
