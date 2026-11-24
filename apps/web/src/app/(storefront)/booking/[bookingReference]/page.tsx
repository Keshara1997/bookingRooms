"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { publicRequest, STOREFRONT_TENANT_SLUG } from "@/lib/public-api";

interface PublicReservation {
  confirmationCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  currency: string;
  totalAmount: string | number;
  hotel: { name: string; slug: string };
  branch: { name: string; city?: string | null };
  guest: { firstName: string; lastName: string };
  rooms: Array<{ roomType: { name: string } }>;
}

export default function BookingStatusPage() {
  const params = useParams<{ bookingReference: string }>();
  const code = params.bookingReference;

  const [reservation, setReservation] = useState<PublicReservation | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await publicRequest<PublicReservation>(
          `/public/tenants/${STOREFRONT_TENANT_SLUG}/bookings/${encodeURIComponent(code)}`,
        );
        setReservation(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Booking not found.",
        );
      }
    }

    void load();
  }, [code]);

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold">Booking status</h1>
      <p className="text-sm text-gray-500">Reference: {code}</p>

      {error && <p className="mt-4 text-red-700">{error}</p>}

      {reservation && (
        <dl className="mt-6 space-y-2 rounded-xl border p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Status</dt>
            <dd className="font-medium">{reservation.status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Hotel</dt>
            <dd>{reservation.hotel.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Stay</dt>
            <dd>
              {new Date(reservation.checkIn).toLocaleDateString()} –{" "}
              {new Date(reservation.checkOut).toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Room</dt>
            <dd>{reservation.rooms[0]?.roomType.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Total</dt>
            <dd>
              {Number(reservation.totalAmount).toFixed(2)}{" "}
              {reservation.currency}
            </dd>
          </div>
        </dl>
      )}

      <Link href="/hotels" className="mt-8 inline-block text-sm text-blue-600">
        ← Home
      </Link>
    </main>
  );
}