"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest, setAccessToken } from "@/lib/api";
import { login } from "@/lib/auth";
import { saveSession } from "@/lib/session";

interface MeResponse {
  memberships: {
    tenant: { id: string; name: string };
    role: string;
  }[];
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await login(email, password);
      setAccessToken(auth.accessToken);

      const profile = await apiRequest<MeResponse>("/auth/me");

      if (profile.memberships.length === 0) {
        throw new Error("This account has no tenant memberships.");
      }

      saveSession(auth.accessToken, profile.memberships[0].tenant.id);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-gray-500">
        Admin dashboard access
      </p>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <label className="block text-sm">
          <span className="text-gray-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="text-gray-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
          />
        </label>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        After <code className="text-xs">npm run db:seed</code>:{" "}
        <span className="font-mono text-xs">
          admin@demo.bookingrooms.local / Demo1234!
        </span>
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        <Link href="/" className="text-blue-600 underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}