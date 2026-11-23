"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { getStoredTenantId, saveSession } from "@/lib/session";

interface Membership {
  tenant: { id: string; name: string };
  role: string;
}

export function TenantSwitcher() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const stored = getStoredTenantId();
        const profile = await apiRequest<{ memberships: Membership[] }>(
          "/auth/me",
        );
        setMemberships(profile.memberships);
        const active =
          stored &&
          profile.memberships.some((m) => m.tenant.id === stored)
            ? stored
            : profile.memberships[0]?.tenant.id ?? "";
        setTenantId(active);
        if (active && active !== stored) {
          const token = sessionStorage.getItem("bookingrooms_access_token");
          if (token) {
            saveSession(token, active);
          }
        }
      } catch {
        setError("Sign in to switch organizations.");
      }
    }

    void load();
  }, []);

  if (error || memberships.length === 0) {
    return null;
  }

  if (memberships.length === 1) {
    return (
      <span className="text-sm text-gray-600">
        {memberships[0].tenant.name}
      </span>
    );
  }

  return (
    <label className="text-sm text-gray-600">
      <span className="sr-only">Organization</span>
      <select
        value={tenantId}
        onChange={(event) => {
          const next = event.target.value;
          const token = sessionStorage.getItem("bookingrooms_access_token");
          if (token) {
            saveSession(token, next);
          }
          setTenantId(next);
          router.refresh();
        }}
        className="rounded border bg-white px-2 py-1 text-sm"
      >
        {memberships.map((membership) => (
          <option key={membership.tenant.id} value={membership.tenant.id}>
            {membership.tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}