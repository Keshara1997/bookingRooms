"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Hotel } from "@/lib/hotel-types";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHotels() {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest<Hotel[]>("/hotels");
      setHotels(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load hotels.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels();
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hotels</h1>
          <p className="mt-2 text-gray-500">
            Manage your hotel properties.
          </p>
        </div>

        <Link
          href="/dashboard/hotels/new"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Add Hotel
        </Link>
      </div>

      {loading && <p>Loading hotels...</p>}

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
          <button
            onClick={() => void loadHotels()}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && hotels.length === 0 && (
        <div className="rounded-xl border p-10 text-center">
          <h2 className="text-xl font-semibold">No hotels yet</h2>
          <p className="mt-2 text-gray-500">
            Create your first hotel to start managing properties.
          </p>
          <Link
            href="/dashboard/hotels/new"
            className="mt-5 inline-block text-blue-600 underline"
          >
            Create your first hotel
          </Link>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <article
            key={hotel.id}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{hotel.name}</h2>

            <p className="mt-2 text-sm text-gray-500">
              {[hotel.city, hotel.country].filter(Boolean).join(", ") ||
                "Location not provided"}
            </p>

            <div className="mt-4 flex justify-between text-sm">
              <span>
                {hotel.branches?.length ?? 0} branches
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {hotel.status}
              </span>
            </div>

            <Link
              href={`/dashboard/hotels/${hotel.id}/branches`}
              className="mt-5 inline-block text-blue-600 underline"
            >
              Manage branches
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}