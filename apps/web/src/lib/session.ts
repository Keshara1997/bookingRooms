import { setAccessToken, setActiveTenantId } from "./api";

const TOKEN_KEY = "bookingrooms_access_token";
const TENANT_KEY = "bookingrooms_tenant_id";

export function hydrateSession() {
  if (typeof window === "undefined") {
    return;
  }

  const token = sessionStorage.getItem(TOKEN_KEY);
  const tenantId = sessionStorage.getItem(TENANT_KEY);

  if (token) {
    setAccessToken(token);
  }

  if (tenantId) {
    setActiveTenantId(tenantId);
  }
}

export function saveSession(accessToken: string, tenantId: string) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(TENANT_KEY, tenantId);
  setAccessToken(accessToken);
  setActiveTenantId(tenantId);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TENANT_KEY);
  setAccessToken(null);
  setActiveTenantId(null);
}

export function getStoredTenantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(TENANT_KEY);
}