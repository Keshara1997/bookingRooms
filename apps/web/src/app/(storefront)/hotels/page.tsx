"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { publicRequest, STOREFRONT_TENANT_SLUG } from "@/lib/public-api";

interface PublicHotel {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  currency: string;
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<PublicHotel[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await publicRequest<PublicHotel[]>(
          `/public/tenants/${STOREFRONT_TENANT_SLUG}/hotels`,
        );
        setHotels(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load hotels.",
        );
      }
    }

    void load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Our hotels</h1>
      <p className="mt-2 text-gray-600">
        Browse properties and book your stay online.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-8 space-y-4">
        {hotels.map((hotel) => (
          <li
            key={hotel.id}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{hotel.name}</h2>
            {hotel.description && (
              <p className="mt-2 text-sm text-gray-600">
                {hotel.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/hotels/${hotel.slug}`}
                className="text-sm text-blue-600 underline"
              >
                View details
              </Link>
              <Link
                href={`/search?hotel=${hotel.slug}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Check availability
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}