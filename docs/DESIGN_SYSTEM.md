# DevNote — Design System

## 1. Conceito e Personalidade
Estética **Engineer Workstation**: sóbria, técnica, focada e utilitária. Inspirada em interfaces modernas de desenvolvedores (Linear, Supabase, Raycast, Ghostty), sem clichês de IA (sem gradientes roxo/azul genéricos, sem cards aninhados desnecessários, sem dados mockados falsos).

## 2. Tema e Cores
- **Modo:** Dark First (fundo profundo com contraste rigoroso para sessões longas de código).
- **Background Base:** `#090a0f` (quase preto, levemente azulado/frio para sensação de profundidade).
- **Surface / Card:** `#11131a` (elevação discreta) com bordas em `#1e2230` (1px sutil, nunca bordas pesadas).
- **Acento Primário (Brand):** Verde Esmeralda Técnico (`#10b981` hover `#059669` / glow `#10b98115`) — tom de terminal estável, não fluorescente.
- **Tipografia Texto:**
  - Primário (Foreground): `#f1f5f9` (alto contraste, leitura nítida).
  - Secundário (Muted): `#94a3b8` (apoio e labels).
  - Bordas / Divisores: `#1e2330`.
- **Estados:**
  - Erro: `#ef4444` (fundo `#ef444415`, borda `#ef444440`).
  - Sucesso: `#10b981`.

## 3. Tipografia
- **UI / Leitura:** Font Sans moderna e neutra (`Geist Sans`, `Inter` ou sistema `-apple-system, BlinkMacSystemFont, "Segoe UI"`).
- **Dados Técnicos / Tags / Código:** Font Mono (`JetBrains Mono`, `Fira Code`, monospace).

## 4. Formato e Microdecisões
- **Bordas (Border Radius):** `rounded-md` (6px) para inputs e botões; `rounded-lg` (8px a 10px) para cards de container. Evitar cantos excessivamente redondos (pill shape) que infantilizam interfaces técnicas.
- **Divisores:** Sutis, preferencialmente borda em um único lado (`border-b border-border/40`).
- **Inputs:** Fundo sólido `#0d0f15`, borda discreta `#1e2330`, foco com anel fino `#10b98140` e borda `#10b981`.
- **Botões:**
  - Primário: Fundo `#10b981`, texto `#090a0f` (contraste ótimo), peso semibold (500-600).
  - Secundário/Ghost: Fundo transparente, borda `#1e2330`, texto `#94a3b8`, hover com texto `#f1f5f9` e fundo `#ffffff08`.

## 5. Iconografia
- Biblioteca: `lucide-react`. Traço consistente de 1.5px a 1.75px.
