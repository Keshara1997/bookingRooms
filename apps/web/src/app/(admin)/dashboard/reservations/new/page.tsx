"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Branch, Hotel } from "@/lib/hotel-types";

interface RoomType {
  id: string;
  name: string;
  code: string;
}

interface RatePlan {
  id: string;
  name: string;
  code: string;
}

interface PricePreview {
  total: number;
  currency: string;
}

export default function NewReservationPage() {
  const router = useRouter();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);

  const [roomTypeId, setRoomTypeId] = useState("");
  const [ratePlanId, setRatePlanId] = useState("");
  const [pricePreview, setPricePreview] = useState<string>("");
  const [confirmOnCreate, setConfirmOnCreate] = useState(true);
  const [availabilityNote, setAvailabilityNote] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Sri Lanka",
    checkIn: "",
    checkOut: "",
    adults: "2",
    children: "0",
    specialRequests: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiRequest<Hotel[]>("/hotels").then((result) => {
      setHotels(result);
      if (result[0]) {
        setHotelId(result[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!hotelId) {
      return;
    }

    void apiRequest<Branch[]>(`/hotels/${hotelId}/branches`).then(
      (result) => {
        setBranches(result);
        setBranchId(result[0]?.id ?? "");
      },
    );

    void apiRequest<{ data: RoomType[] } | RoomType[]>(
      `/hotels/${hotelId}/room-types`,
    ).then((result) => {
      const list = Array.isArray(result) ? result : result.data;
      setRoomTypes(list);
      setRoomTypeId(list[0]?.id ?? "");
    });
  }, [hotelId]);

  useEffect(() => {
    if (!roomTypeId) {
      setRatePlans([]);
      return;
    }

    void apiRequest<{ data: RatePlan[] }>(
      `/room-types/${roomTypeId}/rate-plans?limit=50`,
    ).then((result) => {
      setRatePlans(result.data);
      setRatePlanId(result.data[0]?.id ?? "");
    });
  }, [roomTypeId]);

  useEffect(() => {
    if (!ratePlanId || !form.checkIn || !form.checkOut) {
      setPricePreview("");
      return;
    }

    const params = new URLSearchParams({
      checkIn: form.checkIn,
      checkOut: form.checkOut,
    });

    void apiRequest<PricePreview>(
      `/rate-plans/${ratePlanId}/calculate?${params}`,
    )
      .then((result) => {
        setPricePreview(
          `${Number(result.total).toFixed(2)} ${result.currency}`.trim(),
        );
      })
      .catch(() => {
        setPricePreview("Unable to calculate price.");
      });
  }, [ratePlanId, form.checkIn, form.checkOut]);

  async function checkAvailability() {
    if (!branchId || !roomTypeId || !form.checkIn || !form.checkOut) {
      setAvailabilityNote("Select branch, room type, and dates first.");
      return;
    }

    setAvailabilityNote("Checking availability...");

    try {
      const result = await apiRequest<{
        available: boolean;
        message?: string;
      }>(`/branches/${branchId}/availability`, {
        method: "POST",
        body: JSON.stringify({
          roomTypeId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adults: Number(form.adults),
          children: Number(form.children),
          rooms: 1,
        }),
      });

      setAvailabilityNote(
        result.available
          ? "Rooms are available for these dates."
          : result.message ?? "Not available for these dates.",
      );
    } catch (err) {
      setAvailabilityNote(
        err instanceof Error ? err.message : "Availability check failed.",
      );
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!branchId || !roomTypeId || !ratePlanId) {
      setError("Select hotel, branch, room type, and rate plan.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const reservation = await apiRequest<{ id: string }>(
        `/branches/${branchId}/reservations`,
        {
          method: "POST",
          body: JSON.stringify({
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            adults: Number(form.adults),
            children: Number(form.children),
            source: "ADMIN",
            confirmOnCreate,
            specialRequests: form.specialRequests || undefined,
            guest: {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email || undefined,
              phone: form.phone || undefined,
              address: form.address || undefined,
              country: form.country || undefined,
            },
            rooms: [
              {
                roomTypeId,
                ratePlanId,
              },
            ],
          }),
        },
      );

      router.push(`/dashboard/reservations/${reservation.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create reservation.",
      );
    } finally {
      setLoading(false);
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

      <h1 className="mt-4 text-2xl font-bold">New reservation</h1>
      <p className="mt-1 text-sm text-gray-500">
        Admin booking for one room line (extend later for multi-room).
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-6 space-y-6"
      >
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Hotel
            <select
              value={hotelId}
              onChange={(event) => setHotelId(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Branch
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            First name *
            <input
              required
              value={form.firstName}
              onChange={(event) =>
                setForm({ ...form, firstName: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Last name *
            <input
              required
              value={form.lastName}
              onChange={(event) =>
                setForm({ ...form, lastName: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Phone
            <input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Address
            <input
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Country
            <input
              value={form.country}
              onChange={(event) =>
                setForm({ ...form, country: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Check-in *
            <input
              required
              type="date"
              value={form.checkIn}
              onChange={(event) =>
                setForm({ ...form, checkIn: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Check-out *
            <input
              required
              type="date"
              value={form.checkOut}
              onChange={(event) =>
                setForm({ ...form, checkOut: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Adults
            <input
              type="number"
              min={1}
              value={form.adults}
              onChange={(event) =>
                setForm({ ...form, adults: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Children
            <input
              type="number"
              min={0}
              value={form.children}
              onChange={(event) =>
                setForm({ ...form, children: event.target.value })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Room type *
            <select
              value={roomTypeId}
              onChange={(event) => setRoomTypeId(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Rate plan *
            <select
              value={ratePlanId}
              onChange={(event) => setRatePlanId(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {ratePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.code})
                </option>
              ))}
            </select>
          </label>
          {pricePreview && (
            <p className="text-sm text-gray-600 sm:col-span-2">
              Estimated total: <strong>{pricePreview}</strong>
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={confirmOnCreate}
              onChange={(event) =>
                setConfirmOnCreate(event.target.checked)
              }
            />
            Confirm immediately (front-desk booking)
          </label>
          <button
            type="button"
            onClick={() => void checkAvailability()}
            className="rounded-lg border px-3 py-1.5 hover:bg-slate-50"
          >
            Check availability
          </button>
        </div>

        {availabilityNote && (
          <p className="text-sm text-gray-600">{availabilityNote}</p>
        )}

        <label className="block text-sm">
          Special requests
          <textarea
            value={form.specialRequests}
            onChange={(event) =>
              setForm({ ...form, specialRequests: event.target.value })
            }
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={3}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create reservation"}
        </button>
      </form>
    </main>
  );
}