import { describe, expect, it } from "vitest";
import { normalizeApiUrl } from "./normalize-api-url";

describe("normalizeApiUrl", () => {
  it("troca hosts locais pelo alias do emulador Android", () => {
    expect(normalizeApiUrl("http://localhost:4000/api/v1", "android")).toBe(
      "http://10.0.2.2:4000/api/v1",
    );
    expect(normalizeApiUrl("http://127.0.0.1:4000/api/v1", "android")).toBe(
      "http://10.0.2.2:4000/api/v1",
    );
    expect(normalizeApiUrl("http://0.0.0.0:4000/api/v1", "android")).toBe(
      "http://10.0.2.2:4000/api/v1",
    );
  });

  it("mantem a url para outras plataformas", () => {
    expect(normalizeApiUrl("http://localhost:4000/api/v1", "ios")).toBe(
      "http://localhost:4000/api/v1",
    );
  });
});
