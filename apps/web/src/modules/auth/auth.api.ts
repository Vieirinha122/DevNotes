import type { LoginInput, RegisterInput } from "@devnote/contracts";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export interface AuthResponse {
  id?: string;
  name?: string | null;
  email?: string;
  accessToken?: string;
  user?: {
    id: string;
    name?: string | null;
    email: string;
  };
  error?: string;
}

export async function loginUser(credentials: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ ...credentials, email: normalizeAuthEmail(credentials.email) }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha ao realizar login");
  }

  return data;
}

export async function registerUser(credentials: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ ...credentials, email: normalizeAuthEmail(credentials.email) }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Falha ao registrar usuario");
  }

  return data;
}

export async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
