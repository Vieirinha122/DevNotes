import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/api/base-url";

/**
 * Wrapper simples do SecureStore pro mobile.
 * Salva/Recupera o refresh token e access token de forma cifrada
 * no keystore/keyprotector do Android/iOS.
 *
 * Expo SecureStore usa Android Keystore + iOS Keychain por baixo —
 * os tokens nunca ficam em texto plano no dispositivo.
 */

const CHAVE_REFRESH_TOKEN = "devnote_refresh_token";
const CHAVE_ACCESS_TOKEN = "devnote_access_token";

export async function salvarTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(CHAVE_ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(CHAVE_REFRESH_TOKEN, refreshToken);
}

export async function recuperarAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_ACCESS_TOKEN);
}

export async function recuperarRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CHAVE_REFRESH_TOKEN);
}

export async function limparTokens() {
  await SecureStore.deleteItemAsync(CHAVE_ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(CHAVE_REFRESH_TOKEN);
}

/**
 * Recupera o refresh token e tenta renovar o access token.
 * Usado pelo httpClient quando o access token expira (401).
 */
export async function renovarAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/mobile-auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    await SecureStore.setItemAsync(CHAVE_ACCESS_TOKEN, data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}
