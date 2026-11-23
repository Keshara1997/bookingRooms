"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ReservationPaymentsPanel } from "@/components/reservation-payments-panel";
import { apiRequest } from "@/lib/api";
import type { Reservation } from "@/lib/reservation-types";

export default function ReservationDetailPage() {
  const params = useParams<{ reservationId: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function loadReservation() {
      try {
        setLoading(true);
        setError("");
        const result = await apiRequest<Reservation>(
          `/reservations/${params.reservationId}`,
        );
        setReservation(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reservation.",
        );
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    if (params.reservationId) {
      void loadReservation();
    }
  }, [params.reservationId]);

  async function runStatusAction(
    action: "confirm" | "check-in" | "check-out" | "no-show" | "cancel",
  ) {
    setStatusMessage("");
    if (
      action === "cancel" &&
      !window.confirm("Cancel this reservation?")
    ) {
      return;
    }

    const paths: Record<string, string> = {
      confirm: "confirm",
      "check-in": "check-in",
      "check-out": "check-out",
      "no-show": "no-show",
      cancel: "cancel",
    };

    try {
      await apiRequest(`/reservations/${params.reservationId}/${paths[action]}`, {
        method: "POST",
        body: JSON.stringify(
          action === "cancel" ? { reason: "Cancelled from admin" } : {},
        ),
      });
      setStatusMessage(`Reservation updated (${action}).`);
      await loadReservation();
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Action failed.",
      );
    }
  }

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <Link
        href="/dashboard/reservations"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to reservations
      </Link>

      {loading && (
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {reservation && (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {reservation.confirmationCode}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {reservation.hotel.name} · {reservation.branch.name}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
              {reservation.status}
            </span>
          </div>

          {statusMessage && (
            <p className="mt-4 text-sm text-gray-600">{statusMessage}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {reservation.status === "PENDING" && (
              <button
                type="button"
                onClick={() => void runStatusAction("confirm")}
                className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Confirm
              </button>
            )}
            {reservation.status === "CONFIRMED" && (
              <>
                <button
                  type="button"
                  onClick={() => void runStatusAction("check-in")}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Check in
                </button>
                <button
                  type="button"
                  onClick={() => void runStatusAction("no-show")}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  No-show
                </button>
              </>
            )}
            {reservation.status === "CHECKED_IN" && (
              <button
                type="button"
                onClick={() => void runStatusAction("check-out")}
                className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Check out
              </button>
            )}
            {(reservation.status === "PENDING" ||
              reservation.status === "CONFIRMED") && (
              <button
                type="button"
                onClick={() => void runStatusAction("cancel")}
                className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Cancel
              </button>
            )}
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-gray-500">Guest</dt>
              <dd>
                <Link
                  href={`/dashboard/guests/${reservation.guest.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {reservation.guest.firstName} {reservation.guest.lastName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Check-in</dt>
              <dd>
                {new Date(reservation.checkIn).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Check-out</dt>
              <dd>
                {new Date(reservation.checkOut).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Guests</dt>
              <dd>
                {reservation.adults} adults, {reservation.children} children
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Total</dt>
              <dd className="font-semibold">
                {Number(reservation.totalAmount).toFixed(2)}{" "}
                {reservation.currency}
              </dd>
            </div>
          </dl>

          {reservation.rooms.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Rooms</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {reservation.rooms.map((line) => (
                  <li key={line.id} className="rounded border p-3">
                    {line.roomType.name} ({line.roomType.code})
                    {line.room && (
                      <span className="text-gray-600">
                        {" "}
                        · Room {line.room.roomNumber}
                      </span>
                    )}
                    <span className="block text-gray-500">
                      Nightly rate:{" "}
                      {Number(line.nightlyRate).toFixed(2)}{" "}
                      {reservation.currency}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reservation.specialRequests && (
            <section className="mt-6 text-sm">
              <h2 className="font-semibold">Special requests</h2>
              <p className="mt-1 whitespace-pre-wrap text-gray-600">
                {reservation.specialRequests}
              </p>
            </section>
          )}

          <ReservationPaymentsPanel reservationId={reservation.id} />
        </>
      )}
    </main>
  );
}