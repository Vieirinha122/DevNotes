import {
  limparTokens,
  recuperarAccessToken,
  recuperarRefreshToken,
  renovarAccessToken,
} from "../store/auth-store.js";
import { API_URL } from "./base-url.js";

/**
 * Cliente HTTP minimalista pra API DevNote.
 * - Usa fetch nativo do React Native
 * - Intercepta 401 e tenta renovar o access token automáticamente
 * - Rejeita se o refresh token expirou (força logout)
 */

interface Options extends RequestInit {
  retry?: boolean;
}

let renouvando = false;
let promessaRenovacao: Promise<string | null> | null = null;

export async function apiFetch(endpoint: string, options: Options = {}) {
  const token = await recuperarAccessToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Se 401 e ainda não estamos renovando, tenta renovar uma vez
  if (response.status === 401 && token && options.retry !== false) {
    const novoToken = await obterTokenRenovado();

    if (novoToken) {
      // Retry a request original com o novo token
      headers.set("Authorization", `Bearer ${novoToken}`);
      return fetch(`${API_URL}${endpoint}`, { ...options, headers });
    }

    // Refresh falhou — limpa tudo
    await limparTokens();
  }

  return response;
}

/**
 * Garante que só uma renovação aconteça por vez (evita thundering herd).
 */
async function obterTokenRenovado(): Promise<string | null> {
  const refreshToken = await recuperarRefreshToken();
  if (!refreshToken) {
    await limparTokens();
    return null;
  }

  if (renouvando && promessaRenovacao) {
    return promessaRenovacao;
  }

  renouvando = true;
  promessaRenovacao = renovarAccessToken(refreshToken);

  const token = await promessaRenovacao;

  renouvando = false;
  promessaRenovacao = null;

  if (!token) {
    await limparTokens();
  }

  return token;
}
