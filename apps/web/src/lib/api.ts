const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
const ACCESS_TOKEN_KEY = "devnote_access_token";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  requireAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.accessToken) {
    throw new ApiError(data.error || "Sessao expirada", response.status);
  }

  setAccessToken(data.accessToken);
  return data.accessToken as string;
}

export async function apiRequest<T>(
  path: string,
  {
    method = "GET",
    body,
    headers,
    requireAuth = false,
    retryOnUnauthorized = true,
  }: RequestOptions = {},
): Promise<T> {
  const finalHeaders = new Headers(headers);

  if (body !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && requireAuth && retryOnUnauthorized) {
    try {
      const refreshedToken = await refreshAccessToken();
      return apiRequest<T>(path, {
        method,
        body,
        headers: {
          ...Object.fromEntries(finalHeaders.entries()),
          Authorization: `Bearer ${refreshedToken}`,
        },
        requireAuth: false,
        retryOnUnauthorized: false,
      });
    } catch (error) {
      clearAccessToken();
      throw error;
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || "Falha na requisicao", response.status);
  }

  return data as T;
}
