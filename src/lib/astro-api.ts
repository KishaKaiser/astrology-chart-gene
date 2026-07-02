const BASE_URL = (import.meta.env.VITE_ASTRO_API_BASE_URL as string | undefined) ?? "https://api.astrology.link"
const TOKEN_KEY = "astrology_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export interface AstroUser {
  id: string
  email: string
  username: string
  createdAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const astroApi = {
  auth: {
    register: (data: { email: string; password: string; username: string }) =>
      request<{ token: string; user: AstroUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: AstroUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  user: {
    me: () => request<AstroUser>("/me"),
  },
}
