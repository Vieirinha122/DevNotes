/**
 * Design tokens do mobile — espelha o DESIGN_SYSTEM.md (web).
 *
 * Extraído de forma centralizada pra evitar hardcoded hex espalhado.
 * Qualquer tela/componente importa de aqui.
 *
 * Inspiração: shadcn/ui tokens (colors.ts) mas em StyleSheet format.
 * Futuro: se adotarmos nativewind, mapeia isso pro tailwind.config.
 */
export const cores = {
  // Backgrounds
  background: "#090a0f", // base profundo
  surface: "#11131a", // elevação discreta (cards)
  surfaceStrong: "#1a1f29", // usado em inputs/Secondary surfaces

  // Foreground
  foreground: "#f1f5f9", // texto primário
  foregroundMuted: "#94a3b8", // texto secundário
  foregroundMutedForeground: "#6b7280", // texto mais fraco (labels)

  // Acento
  primary: "#10b981", // verde esmeralda técnico
  primaryHover: "#059669",
  primaryForeground: "#090a0f", // texto sobre primary

  // Bordas / divisores
  border: "#1e2330",
  borderStrong: "#1e2230",
  borderMuted: "#272a34",

  // Estados
  error: "#ef4444",
  errorForeground: "#090a0f",
  success: "#10b981",
  warning: "#f59e0b",

  // Elementos específicos
  tagBackground: "#374151",
  tagText: "#93c5fd",
  swipeDeleteBackground: "#ef4444",
} as const;

export const espacamento = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  xl3: 32,
} as const;

export const radius = {
  sm: 6, // inputs e botões
  md: 8, // cards e containers
  lg: 12, // modals / sheets
  full: 999, // pills / FAB
} as const;

/**
 * Tipografia — seguindo Material type scale (Body, Title, Label).
 * No RN, usar tamanhos em `pt` (equivalente a `sp` em Android nativo).
 */
export const tipografia = {
  // Títulos
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: "600" as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 26 },

  // Corpo
  corpo: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  corpoPequeno: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },

  // Labels e metadados
  label: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: "400" as const, lineHeight: 16 },
} as const;

/**
 * Altura mínima de toque: 48dp (Android) / 44pt (iOS).
 * Usado pra garantir acessibilidade nos botões.
 */
export const toqueMinimo = 48;
