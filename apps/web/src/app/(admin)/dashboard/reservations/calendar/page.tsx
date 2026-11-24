"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Branch, Hotel } from "@/lib/hotel-types";
import type { ReservationListItem } from "@/lib/reservation-types";

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function startOfWeek(date: Date): Date {
  const copy = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-900 border-blue-200",
  CHECKED_IN: "bg-green-100 text-green-900 border-green-200",
  CHECKED_OUT: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function ReservationsCalendarPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [reservations, setReservations] = useState<ReservationListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [weekStart]);

  const rangeEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const loadReservations = useCallback(async () => {
    if (!branchId) {
      setReservations([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const query = new URLSearchParams({
        overlapsFrom: formatIsoDate(weekStart),
        overlapsTo: formatIsoDate(rangeEnd),
      });
      const result = await apiRequest<ReservationListItem[]>(
        `/branches/${branchId}/reservations?${query.toString()}`,
      );
      setReservations(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load calendar.",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId, rangeEnd, weekStart]);

  useEffect(() => {
    async function loadHotels() {
      try {
        const result = await apiRequest<Hotel[]>("/hotels");
        setHotels(result);
        if (result[0]) {
          setHotelId(result[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load hotels.",
        );
      }
    }

    void loadHotels();
  }, []);

  useEffect(() => {
    if (!hotelId) {
      return;
    }

    async function loadBranches() {
      try {
        const result = await apiRequest<Branch[]>(
          `/hotels/${hotelId}/branches`,
        );
        setBranches(result);
        setBranchId(result[0]?.id ?? "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load branches.",
        );
      }
    }

    void loadBranches();
  }, [hotelId]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  function nightsInView(checkInRaw: string, checkOutRaw: string) {
    const checkIn = new Date(`${checkInRaw.slice(0, 10)}T00:00:00.000Z`);
    const checkOut = new Date(`${checkOutRaw.slice(0, 10)}T00:00:00.000Z`);

    return weekDays.map((day) => {
      const key = formatIsoDate(day);
      const inStay =
        checkIn.getTime() <= day.getTime() &&
        checkOut.getTime() > day.getTime();
      return { key, inStay };
    });
  }

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservation calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Week view for overlapping stays at a branch.
          </p>
        </div>
        <Link
          href="/dashboard/reservations"
          className="text-sm text-blue-600 underline"
        >
          List view
        </Link>
      </div>

      {hotels.length > 0 && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-gray-600">Hotel</span>
            <select
              value={hotelId}
              onChange={(event) => setHotelId(event.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-gray-600">Branch</span>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((value) => addDays(value, -7))}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Previous week
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          This week
        </button>
        <button
          type="button"
          onClick={() => setWeekStart((value) => addDays(value, 7))}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Next week
        </button>
        <span className="text-sm text-gray-600">
          {formatIsoDate(weekStart)} — {formatIsoDate(addDays(weekStart, 6))}
        </span>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading calendar...</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && reservations.length === 0 && !error && branchId && (
        <p className="text-sm text-gray-500">
          No stays overlap this week.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b p-2 text-left text-gray-500">
                Reservation
              </th>
              {weekDays.map((day) => (
                <th
                  key={formatIsoDate(day)}
                  className="border-b p-2 text-center text-gray-500"
                >
                  {day.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const nights = nightsInView(
                String(reservation.checkIn),
                String(reservation.checkOut),
              );
              const color =
                STATUS_COLORS[reservation.status] ??
                "bg-slate-50 text-slate-800 border-slate-200";

              return (
                <tr key={reservation.id} className="border-b">
                  <td className="p-2 align-top">
                    <Link
                      href={`/dashboard/reservations/${reservation.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {reservation.confirmationCode}
                    </Link>
                    <div className="text-gray-600">
                      {reservation.guest.firstName}{" "}
                      {reservation.guest.lastName}
                    </div>
                    <span
                      className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-xs ${color}`}
                    >
                      {reservation.status}
                    </span>
                  </td>
                  {nights.map((night) => (
                    <td key={night.key} className="p-1 text-center">
                      {night.inStay ? (
                        <div
                          className={`mx-auto h-6 w-full max-w-[3rem] rounded border ${color}`}
                          title={reservation.confirmationCode}
                        />
                      ) : (
                        <span className="text-gray-300">·</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}