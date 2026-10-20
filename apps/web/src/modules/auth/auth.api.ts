import type { LoginInput, RegisterInput } from "@devnote/contracts";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export interface AuthResponse {
  id?: string;
  email?: string;
  accessToken?: string;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
}

/**
 * Realiza login enviando email e senha.
 * Retorna access token e dados do usuário autenticado.
 */
export async function loginUser(credentials: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Envia e recebe cookie HttpOnly de refresh token
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha ao realizar login");
  }

  return data;
}

/**
 * Cadastra novo usuário com email e senha.
 */
export async function registerUser(credentials: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha ao registrar usuário");
  }

  return data;
}
