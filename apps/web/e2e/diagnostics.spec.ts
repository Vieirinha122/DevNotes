import { expect, test } from "@playwright/test";

/**
 * Teste de diagnostico: abre o app e capta erros em tempo real.
 * Falha se houver:
 * - pageerror (exceção JS não tratada)
 * - console.error (erro no console do browser)
 * - requestfailed (falha de rede em qualquer request)
 *
 * Isso me avisa se algo realmente quebrou — um botão que não responde,
 * um fetch que retorna 500, uma exceção não tratada.
 */
test.describe("Diagnóstico do app", () => {
  let errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors = [];

    // Capta exceções JS não tratadas
    page.on("pageerror", (error) => {
      errors.push(`JS Error: ${error.message}`);
    });

    // Capta console.error
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(`Console Error: ${message.text()}`);
      }
    });

    // Capta falhas de rede (requests que falharam)
    page.on("requestfailed", (request) => {
      const error = request.failure();
      errors.push(`Network Failed: ${request.method()} ${request.url()} - ${error?.errorText}`);
    });
  });

  test("app abre sem erros de console, JS ou rede", async ({ page }) => {
    // Navega pra home — ajusta pra rota real do app
    const response = await page.goto("/");

    // Verifica status HTTP (200-399 = ok)
    expect(response?.status()).toBeLessThan(400);

    // Espera o conteúdo principal aparecer (ajusta pra selecionar algo que SEMPRE existe)
    await expect(page.locator("body")).toBeVisible();

    // Se tiver erros, mostra eles
    expect(errors).toEqual([]);
  });
});
