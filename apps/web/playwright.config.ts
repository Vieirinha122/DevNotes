import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright — testes de diagnóstico no browser.
 * Capta: erros de JS (pageerror), erros no console, falhas de rede (requestfailed).
 * Integra com o Vite dev server via webServer.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Garante que o servidor dev do Vite tá rodando antes do teste
  webServer: {
    command: "pnpm --filter devnote-web dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
