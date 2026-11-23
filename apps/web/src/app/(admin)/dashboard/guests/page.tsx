"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  _count?: { reservations: number };
}

interface GuestsResponse {
  data: Guest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGuests(query = search) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("search", query.trim());
      }

      const path =
        params.size > 0 ? `/guests?${params.toString()}` : "/guests";

      const result = await apiRequest<GuestsResponse>(path);
      setGuests(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load guests.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGuests();
  }, []);

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Guests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search and open guest profiles.
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void loadGuests(search);
          }}
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, or phone"
            className="w-64 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading guests...</p>}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && guests.length === 0 && (
        <p className="text-sm text-gray-500">No guests found.</p>
      )}

      {!loading && guests.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Contact</th>
                <th className="py-2 pr-4 font-medium">Country</th>
                <th className="py-2 pr-4 font-medium">Reservations</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/guests/${guest.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {guest.firstName} {guest.lastName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {guest.email ?? guest.phone ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {guest.country ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {guest._count?.reservations ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}