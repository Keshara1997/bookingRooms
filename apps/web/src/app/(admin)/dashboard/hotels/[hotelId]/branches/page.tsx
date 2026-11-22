"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { apiRequest } from "@/lib/api";
import type { Branch } from "@/lib/hotel-types";

export default function BranchesPage() {
  const params = useParams<{ hotelId: string }>();
  const hotelId = params.hotelId;

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBranches() {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest<Branch[]>(
        `/hotels/${hotelId}/branches`,
      );

      setBranches(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load branches.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBranches();
  }, [hotelId]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/hotels"
            className="text-sm text-blue-600 underline"
          >
            ← Back to hotels
          </Link>

          <h1 className="mt-3 text-3xl font-bold">Hotel Branches</h1>
          <p className="mt-2 text-gray-500">
            Manage the branches belonging to this hotel.
          </p>
        </div>

        <Link
          href={`/dashboard/hotels/${hotelId}/branches/new`}
          className="rounded-lg bg-blue-600 px-5 py-3 text-white"
        >
          + Add Branch
        </Link>
      </div>

      {loading && <p>Loading branches...</p>}

      {error && (
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
          <button
            onClick={() => void loadBranches()}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && branches.length === 0 && (
        <div className="rounded-xl border p-10 text-center">
          <h2 className="text-xl font-semibold">No branches found</h2>
          <p className="mt-2 text-gray-500">
            Create your first branch for this hotel.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <article
            key={branch.id}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{branch.name}</h2>

            <p className="mt-2 text-sm text-gray-500">
              Branch Code: {branch.code}
            </p>

            <p className="mt-2 text-sm">
              {[branch.city, branch.country].filter(Boolean).join(", ")}
            </p>

            <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm">
              {branch.status}
            </span>
          </article>
        ))}
      </div>
    </main>
  );
}