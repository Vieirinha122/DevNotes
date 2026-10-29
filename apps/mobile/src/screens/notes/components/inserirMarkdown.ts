/**
 * Helpers pra inserir marcação markdown na posição do cursor do TextInput.
 *
 * No React Native, TextInput controlado expõe `selection: { start, end }`
 * via onSelectionChange. Esses helpers recebem o conteúdo atual + seleção e
 * devolvem o novo conteúdo + posição do cursor — deixando as ações da
 * toolbar de markdown previsíveis e testáveis sem tocar no DOM.
 */
export interface Selecao {
  start: number;
  end: number;
}

export interface ResultadoInsercao {
  conteudo: string;
  selecao: Selecao;
}

/** Insere texto cortando na seleção; cursor fica `offset` caracteres depois do início da marcação. */
function cortarNaSelecao(
  conteudo: string,
  marcacao: string,
  offset: number,
  selecao: Selecao,
): ResultadoInsercao {
  const antes = conteudo.slice(0, selecao.start);
  const depois = conteudo.slice(selecao.end);
  const novoConteudo = antes + marcacao + depois;
  const posicao = selecao.start + offset;
  return {
    conteudo: novoConteudo,
    selecao: { start: posicao, end: posicao },
  };
}

/**
 * Envolve a seleção atual com prefixo/sufixo.
 * Se não houver seleção, insere vazio e posiciona o cursor entre as marcas.
 */
function envolver(
  conteudo: string,
  prefixo: string,
  sufixo: string,
  selecao: Selecao,
): ResultadoInsercao {
  const temSelecao = selecao.start !== selecao.end;
  if (!temSelecao) {
    return cortarNaSelecao(conteudo, prefixo + sufixo, prefixo.length, selecao);
  }
  const antes = conteudo.slice(0, selecao.start);
  const selecionado = conteudo.slice(selecao.start, selecao.end);
  const depois = conteudo.slice(selecao.end);
  const novoConteudo = antes + prefixo + selecionado + sufixo + depois;
  const posicao = selecao.start + prefixo.length + selecionado.length + sufixo.length;
  return {
    conteudo: novoConteudo,
    selecao: { start: posicao, end: posicao },
  };
}

/** Índice do início da linha que contém o cursor. */
function inicioDaLinha(conteudo: string, cursor: number): number {
  const ateCursor = conteudo.slice(0, cursor);
  const ultimaQuebra = ateCursor.lastIndexOf("\n");
  return ultimaQuebra === -1 ? 0 : ultimaQuebra + 1;
}

/**
 * Ações da toolbar de markdown — cada uma recebe conteúdo + seleção e
 * devolve o conteúdo atualizado + nova posição do cursor.
 */
export const ACOES_MARKDOWN = {
  bold: (conteudo: string, selecao: Selecao): ResultadoInsercao => {
    const temSelecao = selecao.start !== selecao.end;
    if (temSelecao) {
      return envolver(conteudo, "**", "**", selecao);
    }
    // Sem seleção: envolve todo o conteúdo existente e mantém o texto selecionado
    if (conteudo.length > 0) {
      const novoConteudo = `**${conteudo}**`;
      return {
        conteudo: novoConteudo,
        selecao: { start: 2, end: novoConteudo.length - 2 },
      };
    }
    // Campo vazio: insere ** com cursor no meio
    return cortarNaSelecao(conteudo, "**", 1, selecao);
  },
  codigoInline: (conteudo: string, selecao: Selecao): ResultadoInsercao =>
    envolver(conteudo, "`", "`", selecao),
  checklist: (conteudo: string, selecao: Selecao): ResultadoInsercao => {
    const linha = inicioDaLinha(conteudo, selecao.start);
    const marcacao = "- [ ] ";
    return cortarNaSelecao(conteudo, marcacao, marcacao.length, {
      start: linha,
      end: linha,
    });
  },
  lista: (conteudo: string, selecao: Selecao): ResultadoInsercao => {
    const linha = inicioDaLinha(conteudo, selecao.start);
    const marcacao = "- ";
    return cortarNaSelecao(conteudo, marcacao, marcacao.length, {
      start: linha,
      end: linha,
    });
  },
  imagem: (conteudo: string, selecao: Selecao): ResultadoInsercao => {
    if (selecao.start !== selecao.end) {
      // usa a seleção como alt text
      return envolver(conteudo, "![", "](url)", selecao);
    }
    // cursor posicionado dentro de "alt"
    return cortarNaSelecao(conteudo, "![alt](url)", 2, selecao);
  },
} as const;

export type TipoAcaoMarkdown = keyof typeof ACOES_MARKDOWN;
