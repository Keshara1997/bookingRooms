"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { publicRequest, STOREFRONT_TENANT_SLUG } from "@/lib/public-api";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const branchId = searchParams.get("branchId") ?? "";
  const roomName = searchParams.get("roomName") ?? "Room";
  const roomTypeId = searchParams.get("roomTypeId") ?? "";
  const ratePlanId = searchParams.get("ratePlanId") ?? "";
  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const adults = Number(searchParams.get("adults") ?? 2);
  const children = Number(searchParams.get("children") ?? 0);
  const total = searchParams.get("total") ?? "";
  const currency = searchParams.get("currency") ?? "LKR";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Sri Lanka",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!branchId || !roomTypeId || !ratePlanId) {
      setError("Missing booking details. Start again from search.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const reservation = await publicRequest<{
        id: string;
        confirmationCode: string;
      }>(
        `/public/tenants/${STOREFRONT_TENANT_SLUG}/branches/${branchId}/bookings`,
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            checkIn,
            checkOut,
            adults,
            children,
            roomTypeId,
            ratePlanId,
          }),
        },
      );

      router.push(
        `/booking/confirmation?code=${encodeURIComponent(reservation.confirmationCode)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not complete booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold">Complete your booking</h1>
      <p className="mt-2 text-sm text-gray-600">
        {roomName} · {checkIn} → {checkOut}
      </p>
      {total && (
        <p className="mt-1 text-sm font-medium">
          Total: {Number(total).toFixed(2)} {currency}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <label className="block text-sm">
          First name
          <input
            required
            value={form.firstName}
            onChange={(e) =>
              setForm({ ...form, firstName: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Last name
          <input
            required
            value={form.lastName}
            onChange={(e) =>
              setForm({ ...form, lastName: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Phone
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Country
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="mt-1 block w-full rounded-lg border px-3 py-2"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Booking..." : "Request booking"}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500">
        Website bookings are created as <strong>pending</strong> until the
        property confirms them.
      </p>

      <Link href="/search" className="mt-6 inline-block text-sm text-blue-600">
        ← Back to search
      </Link>
    </main>
  );
}