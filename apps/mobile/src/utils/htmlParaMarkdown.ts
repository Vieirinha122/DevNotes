/**
 * Converte HTML (gerado pelo RichEditor) → markdown compatível com Obsidian.
 *
 * O RichEditor do `react-native-pell-rich-editor` retorna HTML com um subset
 * limitado de tags: <p>, <strong>/<b>, <em>/<i>, <code>, <ul>/<ol>/<li>,
 * <input type="checkbox">, <a>, <h1>–<h6>, <br>, <div>.
 *
 * Este conversor usa regex puro — sem dependência de DOM (como `turndown`
 * fazia). Funciona em React Native sem acessar `document`.
 *
 * Fluxo de substituição:
 *   1. Code blocks (<pre><code>) — antes do inline <code>
 *   2. Inline: bold, italic, code, links, images
 *   3. Blocos: checkboxes, listas, headings, blockquotes, parágrafos, divs
 *   4. Limpeza: <br>, strip tags restantes, decode entities, whitespace
 */

/** Para conversão de HTML (do editor) → markdown (pra salvar no banco). */
export function htmlParaMarkdown(html: string): string {
  let md = html;

  // ─── 1. Code blocks (antes do inline code) ───
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n");
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // ─── 2. Inline ───
  md = md.replace(/<a\s[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<img\s[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, "![$2]($1)");
  md = md.replace(/<img\s[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*\/?>/gi, "![$1]($2)");
  md = md.replace(/<(strong|b)>(.*?)<\/\1>/gi, "**$2**");
  md = md.replace(/<(em|i)>(.*?)<\/\1>/gi, "_$2_");
  md = md.replace(/<code>(.*?)<\/code>/gi, "`$1`");

  // ─── 3. Blocos ───

  // Headings
  md = md.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, content) =>
    "#".repeat(Number(level)) + " " + content.trim(),
  );

  // Checkbox list items — usa função pra lidar com qualquer ordem de atributos
  md = md.replace(/<li[^>]*>\s*(<input[^>]*>)\s*(.*?)<\/li>/gi, (_, inputTag, texto) => {
    const ehCheckbox = /type=["']checkbox["']/i.test(inputTag);
    if (!ehCheckbox) return `- ${texto}`;
    const marcado = /checked/i.test(inputTag);
    return marcado ? `- [x] ${texto}` : `- [ ] ${texto}`;
  });

  // List items comuns (sem checkbox)
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1");

  // Remove wrappers de lista
  md = md.replace(/<\/?[uo]l[^>]*>/gi, "\n");

  // Blockquote
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1");

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Parágrafos → conteúdo + dupla quebra
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Divs (pell wraps linhas em divs às vezes)
  md = md.replace(/<div[^>]*>(.*?)<\/div>/gi, "$1\n");

  // ─── 4. Limpeza ───
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<[^>]+>/g, ""); // strip tags restantes

  // Decode HTML entities
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#0?39;/g, "'");
  md = md.replace(/&#x27;/g, "'");

  // Limpa whitespace excessivo
  md = md.replace(/[ \t]+$/gm, ""); // trailing spaces por linha
  md = md.replace(/\n{3,}/g, "\n\n"); // máximo 2 newlines seguidas

  return md.trim();
}

/** Para conversão de markdown (do banco) → HTML (pra carregar no editor). */
export function markdownParaHtml(markdown: string): string {
  // md→html via regras simples de regex — suficientes pro subset do editor
  // de notas (bold, checklist, list, code, heading)
  let html = markdown;

  // Headings (#)
  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold (**texto**)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic (*texto*)
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!!)/g, "<em>$1</em>");

  // Code inline (`código`)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Checklist (- [ ] / - [x]) — fecha tags pra HTML válido pro WebView
  html = html.replace(/^(\s*)- \[ \] (.+)$/gm, '<ul><li><input type="checkbox" />$2</li></ul>');
  html = html.replace(
    /^(\s*)- \[x\] (.+)$/gm,
    '<ul><li><input type="checkbox" checked="checked" />$2</li></ul>',
  );

  // Lista não-ordenada (- item)
  html = html.replace(/^(\s*)- (.+)$/gm, "<ul><li>$2</li></ul>");

  // Lista ordenada (1. item)
  html = html.replace(/^(\s*\d+)\. (.+)$/gm, "<ol><li>$2</li></ol>");

  // Imagem ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Link [texto](url)
  html = html.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Parágrafos (duplas quebras)
  html = html.replace(/\n\n/g, "</p><p>");

  return `<p>${html}</p>`;
}
