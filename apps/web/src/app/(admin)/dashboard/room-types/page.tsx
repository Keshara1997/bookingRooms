"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Hotel } from "@/lib/hotel-types";

interface RoomType {
  id: string;
  name: string;
  code: string;
  basePrice: number | string;
  maxAdults: number;
  maxChildren: number;
}

interface RoomTypesResponse {
  data: RoomType[];
  pagination: {
    total: number;
  };
}

export default function RoomTypesPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError("");
        const hotelList = await apiRequest<Hotel[]>("/hotels");
        setHotels(hotelList);
        if (hotelList.length > 0) {
          setHotelId(hotelList[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load hotels.",
        );
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!hotelId) {
      return;
    }

    async function loadRoomTypes() {
      try {
        setLoading(true);
        setError("");
        const result = await apiRequest<RoomTypesResponse>(
          `/hotels/${hotelId}/room-types`,
        );
        setRoomTypes(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load room types.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRoomTypes();
  }, [hotelId]);

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Room types</h1>
          <p className="mt-1 text-sm text-gray-500">
            Catalog and pricing by hotel.
          </p>
        </div>

        {hotelId && (
          <Link
            href={`/dashboard/room-types/new?hotelId=${hotelId}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + Add room type
          </Link>
        )}
      </div>

      {hotels.length > 0 && (
        <label className="mb-4 block text-sm">
          <span className="text-gray-600">Hotel</span>
          <select
            value={hotelId}
            onChange={(event) => setHotelId(event.target.value)}
            className="mt-1 block w-full max-w-md rounded-lg border px-3 py-2"
          >
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && hotels.length === 0 && (
        <p className="text-sm text-gray-500">
          Create a hotel first, then add room types.{" "}
          <Link href="/dashboard/hotels/new" className="text-blue-600 underline">
            Add hotel
          </Link>
        </p>
      )}

      {!loading && roomTypes.length === 0 && hotels.length > 0 && (
        <p className="text-sm text-gray-500">No room types for this hotel yet.</p>
      )}

      {roomTypes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Code</th>
                <th className="py-2 pr-4 font-medium">Guests</th>
                <th className="py-2 pr-4 font-medium">Base price</th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((roomType) => (
                <tr key={roomType.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/room-types/${roomType.id}/edit`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {roomType.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{roomType.code}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {roomType.maxAdults}+{roomType.maxChildren}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {Number(roomType.basePrice).toFixed(2)}
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