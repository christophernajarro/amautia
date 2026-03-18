const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export { API_URL };

interface FetchOptions extends RequestInit {
  token?: string;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (res.ok) {
      const tokens = await res.json();
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      return true;
    }
  } catch {}
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  return false;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...customHeaders as Record<string, string>,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  let res = await fetch(`${API_URL}${endpoint}`, {
    headers,
    signal: controller.signal,
    ...rest,
  });
  clearTimeout(timeoutId);

  // Auto-refresh token on 401 (with mutex to prevent concurrent refreshes)
  if (res.status === 401 && token && typeof window !== "undefined") {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      const newToken = localStorage.getItem("access_token");
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${endpoint}`, { headers, ...rest });
    } else {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/registro") && !path.startsWith("/forgot-password") && !path.startsWith("/reset-password")) {
        window.location.href = "/login";
      }
      throw new Error("Sesión expirada");
    }
  }

  if (res.status === 429) {
    throw new Error("Demasiadas solicitudes. Intenta de nuevo en un momento.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error del servidor" }));
    throw new Error(error.detail || `Error ${res.status}`);
  }

  if (res.status === 204) return null as T;

  return res.json();
}
