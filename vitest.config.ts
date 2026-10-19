import { configDefaults, defineConfig } from "vitest/config";

// Config base do Vitest compartilhada pelo monorepo
export default defineConfig({
  test: {
    ...configDefaults,
    environment: "node",
    deps: {
      inline: ["@devnote/contracts", "@devnote/domain"],
    },
  },
});
