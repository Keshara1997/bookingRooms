import { apiRequest } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export async function login(
  email: string,
  password: string,
) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function refreshAccessToken() {
  return apiRequest<Omit<AuthResponse, "user">>(
    "/auth/refresh",
    {
      method: "POST",
    },
  );
}

export async function logout() {
  return apiRequest<{ message: string }>(
    "/auth/logout",
    {
      method: "POST",
    },
  );
}