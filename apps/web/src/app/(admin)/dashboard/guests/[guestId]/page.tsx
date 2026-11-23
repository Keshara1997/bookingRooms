"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

interface GuestDetail {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  notes?: string | null;
}

export default function GuestDetailPage() {
  const params = useParams<{ guestId: string }>();
  const [guest, setGuest] = useState<GuestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGuest() {
      try {
        setLoading(true);
        setError("");
        const result = await apiRequest<GuestDetail>(
          `/guests/${params.guestId}`,
        );
        setGuest(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load guest.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.guestId) {
      void loadGuest();
    }
  }, [params.guestId]);

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <Link
        href="/dashboard/guests"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to guests
      </Link>

      {loading && (
        <p className="mt-4 text-sm text-gray-500">Loading guest...</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {guest && (
        <section className="mt-6">
          <h1 className="text-2xl font-bold">
            {guest.firstName} {guest.lastName}
          </h1>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>{guest.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd>{guest.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Country</dt>
              <dd>{guest.country ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Address</dt>
              <dd>{guest.address ?? "—"}</dd>
            </div>
            {guest.notes && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="whitespace-pre-wrap">{guest.notes}</dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </main>
  );
}