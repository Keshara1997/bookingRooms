"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Branch, Hotel } from "@/lib/hotel-types";
import type { ReservationListItem } from "@/lib/reservation-types";

export default function ReservationsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [reservations, setReservations] = useState<ReservationListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHotels() {
      try {
        setLoading(true);
        setError("");
        const result = await apiRequest<Hotel[]>("/hotels");
        setHotels(result);
        if (result[0]) {
          setHotelId(result[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load hotels.",
        );
      } finally {
        setLoading(false);
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
    if (!branchId) {
      setReservations([]);
      return;
    }

    async function loadReservations() {
      try {
        setLoading(true);
        setError("");
        const result = await apiRequest<ReservationListItem[]>(
          `/branches/${branchId}/reservations`,
        );
        setReservations(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reservations.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReservations();
  }, [branchId]);

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a branch to view bookings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/reservations/calendar"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Calendar
          </Link>
          <Link
            href="/dashboard/reservations/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + New reservation
          </Link>
        </div>
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

      {loading && (
        <p className="text-sm text-gray-500">Loading reservations...</p>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <p className="mt-2 text-xs">
            Sign in at{" "}
            <Link href="/login" className="underline">
              /login
            </Link>{" "}
            if you see tenant or auth errors.
          </p>
        </div>
      )}

      {!loading && reservations.length === 0 && !error && (
        <p className="text-sm text-gray-500">No reservations for this branch.</p>
      )}

      {reservations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Guest</th>
                <th className="py-2 pr-3">Stay</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-b">
                  <td className="py-3 pr-3">
                    <Link
                      href={`/dashboard/reservations/${reservation.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {reservation.confirmationCode}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    {reservation.guest.firstName}{" "}
                    {reservation.guest.lastName}
                  </td>
                  <td className="py-3 pr-3 text-gray-600">
                    {new Date(reservation.checkIn).toLocaleDateString()} –{" "}
                    {new Date(reservation.checkOut).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-3">{reservation.status}</td>
                  <td className="py-3 pr-3">
                    {Number(reservation.totalAmount).toFixed(2)}{" "}
                    {reservation.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}