"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { publicRequest, STOREFRONT_TENANT_SLUG } from "@/lib/public-api";

interface HotelDetailResponse {
  hotel: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    currency: string;
    branches: Array<{
      id: string;
      name: string;
      code: string;
      city?: string | null;
    }>;
    roomTypes: Array<{
      id: string;
      name: string;
      description?: string | null;
      maxAdults: number;
      maxChildren: number;
    }>;
  };
}

export default function HotelDetailPage() {
  const params = useParams<{ hotelSlug: string }>();
  const hotelSlug = params.hotelSlug;

  const [data, setData] = useState<HotelDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await publicRequest<HotelDetailResponse>(
          `/public/tenants/${STOREFRONT_TENANT_SLUG}/hotels/${hotelSlug}`,
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load hotel.",
        );
      }
    }

    void load();
  }, [hotelSlug]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-red-700">{error}</main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-gray-500">Loading...</main>
    );
  }

  const { hotel } = data;
  const branch = hotel.branches[0];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/hotels" className="text-sm text-blue-600 underline">
        ← All hotels
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{hotel.name}</h1>
      {hotel.description && (
        <p className="mt-2 text-gray-600">{hotel.description}</p>
      )}

      {branch && (
        <p className="mt-2 text-sm text-gray-500">
          {branch.name}
          {branch.city ? ` — ${branch.city}` : ""}
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold">Room types</h2>
      <ul className="mt-3 space-y-3">
        {hotel.roomTypes.map((roomType) => (
          <li key={roomType.id} className="rounded-lg border p-4 text-sm">
            <p className="font-medium">{roomType.name}</p>
            {roomType.description && (
              <p className="text-gray-600">{roomType.description}</p>
            )}
            <p className="mt-1 text-gray-500">
              Up to {roomType.maxAdults} adults
              {roomType.maxChildren > 0
                ? `, ${roomType.maxChildren} children`
                : ""}
            </p>
          </li>
        ))}
      </ul>

      {branch && (
        <Link
          href={`/search?hotel=${hotel.slug}&branchId=${branch.id}`}
          className="mt-8 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        >
          Search dates &amp; book
        </Link>
      )}
    </main>
  );
}