"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest, setAccessToken } from "@/lib/api";
import { login } from "@/lib/auth";
import { saveSession } from "@/lib/session";

interface Membership {
  tenant: { id: string; name: string };
  role: string;
}

interface MeResponse {
  memberships: Membership[];
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accessToken, setLocalAccessToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await login(email, password);
      setAccessToken(auth.accessToken);
      setLocalAccessToken(auth.accessToken);

      const profile = await apiRequest<MeResponse>("/auth/me");

      if (profile.memberships.length === 0) {
        throw new Error("This account has no tenant memberships.");
      }

      if (profile.memberships.length === 1) {
        saveSession(auth.accessToken, profile.memberships[0].tenant.id);
        router.push("/dashboard");
        return;
      }

      setMemberships(profile.memberships);
      setSelectedTenantId(profile.memberships[0].tenant.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function finishTenantSelection() {
    if (!accessToken || !selectedTenantId) {
      return;
    }

    saveSession(accessToken, selectedTenantId);
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-2 text-sm text-gray-500">
        Admin dashboard access
      </p>

      {memberships.length === 0 ? (
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
      ) : (
        <div className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">
            Choose the organization to manage:
          </p>
          <select
            value={selectedTenantId}
            onChange={(event) => setSelectedTenantId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {memberships.map((membership) => (
              <option key={membership.tenant.id} value={membership.tenant.id}>
                {membership.tenant.name} ({membership.role})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={finishTenantSelection}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white hover:bg-blue-700"
          >
            Continue to dashboard
          </button>
        </div>
      )}

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