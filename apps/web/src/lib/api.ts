const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

// Keep access tokens in memory, not localStorage.
let accessToken: string | null = null;
let activeTenantId: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setActiveTenantId(tenantId: string | null) {
  activeTenantId = tenantId;
}

interface ApiOptions extends RequestInit {
  body?: BodyInit | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (activeTenantId) {
    headers.set("X-Tenant-ID", activeTenantId);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const rawMessage = errorBody?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : typeof rawMessage === "string"
        ? rawMessage
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}