"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { publicRequest, STOREFRONT_TENANT_SLUG } from "@/lib/public-api";

interface PublicReservation {
  confirmationCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  currency: string;
  totalAmount: string | number;
  hotel: { name: string };
  guest: { firstName: string; lastName: string; email?: string | null };
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";

  const [reservation, setReservation] = useState<PublicReservation | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) {
      return;
    }

    async function load() {
      try {
        const result = await publicRequest<PublicReservation>(
          `/public/tenants/${STOREFRONT_TENANT_SLUG}/bookings/${encodeURIComponent(code)}`,
        );
        setReservation(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load booking.",
        );
      }
    }

    void load();
  }, [code]);

  if (!code) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <p>Missing confirmation code.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold text-green-700">Booking received</h1>

      {error && (
        <p className="mt-4 text-red-700">{error}</p>
      )}

      {reservation && (
        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Confirmation code</p>
          <p className="text-xl font-semibold tracking-wide">
            {reservation.confirmationCode}
          </p>
          <p className="mt-4 text-sm">
            Status: <strong>{reservation.status}</strong>
          </p>
          <p className="text-sm text-gray-600">
            {reservation.hotel.name} ·{" "}
            {new Date(reservation.checkIn).toLocaleDateString()} –{" "}
            {new Date(reservation.checkOut).toLocaleDateString()}
          </p>
          <p className="mt-2 text-sm">
            Total: {Number(reservation.totalAmount).toFixed(2)}{" "}
            {reservation.currency}
          </p>
          {reservation.guest.email && (
            <p className="mt-2 text-sm text-gray-500">
              Details were sent to {reservation.guest.email} when the stay
              is confirmed.
            </p>
          )}
          <Link
            href={`/booking/${reservation.confirmationCode}`}
            className="mt-6 inline-block text-blue-600 underline"
          >
            View booking status
          </Link>
        </div>
      )}

      <Link href="/hotels" className="mt-8 inline-block text-sm text-blue-600">
        Book another stay
      </Link>
    </main>
  );
}