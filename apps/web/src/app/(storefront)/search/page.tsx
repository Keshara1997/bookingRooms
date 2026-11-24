"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { publicRequest, STOREFRONT_TENANT_SLUG } from "@/lib/public-api";

interface SearchOption {
  roomType: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
  };
  ratePlan: { id: string; name: string; code: string } | null;
  pricing: {
    total: number;
    currency: string;
    nights: number;
  } | null;
  currency: string;
}

interface SearchResponse {
  branch: { id: string; name: string };
  hotel: { id: string; name: string; slug: string; currency: string };
  stay: { checkIn: string; checkOut: string; adults: number; children: number };
  options: SearchOption[];
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelSlug = searchParams.get("hotel") ?? "colombo-city";
  const initialBranchId = searchParams.get("branchId") ?? "";

  const [branchId, setBranchId] = useState(initialBranchId);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadHotel() {
      if (branchId) {
        return;
      }

      try {
        const detail = await publicRequest<{
          hotel: { branches: Array<{ id: string }> };
        }>(
          `/public/tenants/${STOREFRONT_TENANT_SLUG}/hotels/${hotelSlug}`,
        );
        setBranchId(detail.hotel.branches[0]?.id ?? "");
      } catch {
        setError("Could not resolve branch for this hotel.");
      }
    }

    void loadHotel();
  }, [branchId, hotelSlug]);

  async function runSearch(event?: React.FormEvent) {
    event?.preventDefault();

    if (!branchId || !checkIn || !checkOut) {
      setError("Choose dates and wait for branch to load.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        checkIn,
        checkOut,
        adults,
        children,
      });
      const response = await publicRequest<SearchResponse>(
        `/public/tenants/${STOREFRONT_TENANT_SLUG}/branches/${branchId}/search?${query}`,
      );
      setResult(response);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function bookOption(option: SearchOption) {
    if (!result || !option.ratePlan) {
      return;
    }

    const query = new URLSearchParams({
      branchId: result.branch.id,
      hotelSlug: result.hotel.slug,
      roomTypeId: option.roomType.id,
      ratePlanId: option.ratePlan.id,
      checkIn: result.stay.checkIn,
      checkOut: result.stay.checkOut,
      adults: String(result.stay.adults),
      children: String(result.stay.children),
      total: String(option.pricing?.total ?? ""),
      currency: option.pricing?.currency ?? result.hotel.currency,
      roomName: option.roomType.name,
    });

    router.push(`/booking/checkout?${query.toString()}`);
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Find a room</h1>
      <p className="mt-2 text-gray-600">
        Search live rates and availability.
      </p>

      <form
        onSubmit={(event) => void runSearch(event)}
        className="mt-6 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2"
      >
        <label className="text-sm">
          Check-in
          <input
            type="date"
            required
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Check-out
          <input
            type="date"
            required
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Adults
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(event) => setAdults(event.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Children
          <input
            type="number"
            min={0}
            value={children}
            onChange={(event) => setChildren(event.target.value)}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            {result.hotel.name} — {result.branch.name}
          </h2>
          <p className="text-sm text-gray-500">
            {result.stay.checkIn} → {result.stay.checkOut}
          </p>

          {result.options.length === 0 && (
            <p className="mt-4 text-gray-600">
              No rooms available for these dates.
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {result.options.map((option) => (
              <li
                key={option.roomType.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{option.roomType.name}</p>
                  {option.pricing ? (
                    <p className="text-sm text-gray-600">
                      {option.pricing.total.toFixed(2)}{" "}
                      {option.pricing.currency} total (
                      {option.pricing.nights} nights)
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No online rate plan configured.
                    </p>
                  )}
                </div>
                {option.ratePlan && option.pricing && (
                  <button
                    type="button"
                    onClick={() => bookOption(option)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Book
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/hotels" className="mt-8 inline-block text-sm text-blue-600">
        ← Back to hotels
      </Link>
    </main>
  );
}