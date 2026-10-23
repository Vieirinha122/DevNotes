export const FALLBACK_API_URL = "http://localhost:4000/api/v1";

export function normalizeApiUrl(apiUrl: string | undefined, platform: string) {
  const normalized = (apiUrl || FALLBACK_API_URL).trim().replace(/\/+$/, "");

  if (platform !== "android") {
    return normalized;
  }

  return normalized
    .replace("://localhost", "://10.0.2.2")
    .replace("://127.0.0.1", "://10.0.2.2")
    .replace("://0.0.0.0", "://10.0.2.2");
}
