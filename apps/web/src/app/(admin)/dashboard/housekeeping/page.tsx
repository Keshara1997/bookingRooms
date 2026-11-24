"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type { Branch, Hotel } from "@/lib/hotel-types";

interface HousekeepingTask {
  id: string;
  status: string;
  description?: string | null;
  room: {
    roomNumber: string;
    floor?: number | null;
    status: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function HousekeepingPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiRequest<Hotel[]>("/hotels")
      .then((result) => {
        setHotels(result);
        if (result[0]) {
          setHotelId(result[0].id);
        }
      })
      .catch(() => setMessage("Sign in to view housekeeping tasks."));
  }, []);

  useEffect(() => {
    if (!hotelId) {
      return;
    }

    void apiRequest<Branch[]>(`/hotels/${hotelId}/branches`)
      .then((result) => {
        setBranches(result);
        setBranchId(result[0]?.id ?? "");
      })
      .catch(() => setMessage("Could not load branches."));
  }, [hotelId]);

  useEffect(() => {
    if (!branchId) {
      setTasks([]);
      return;
    }

    async function loadTasks() {
      try {
        setLoading(true);
        const result = await apiRequest<HousekeepingTask[]>(
          `/branches/${branchId}/housekeeping-tasks`,
        );
        setTasks(result);
      } catch (err) {
        setMessage(
          err instanceof Error ? err.message : "Could not load tasks.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTasks();
  }, [branchId]);

  async function completeTask(taskId: string) {
    try {
      await apiRequest(`/housekeeping-tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      setMessage("Room marked clean.");
      setTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed.");
    }
  }

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Housekeeping</h1>
      <p className="mt-1 text-sm text-gray-500">
        Post-checkout cleaning tasks appear automatically when a guest checks
        out with an assigned room.
      </p>

      {hotels.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Hotel
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
            Branch
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
      {loading && (
        <p className="mt-4 text-sm text-gray-500">Loading tasks...</p>
      )}

      {!loading && tasks.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">No open tasks.</p>
      )}

      <ul className="mt-4 space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm"
          >
            <div>
              <p className="font-medium">
                Room {task.room.roomNumber}
                {task.room.floor != null ? ` (floor ${task.room.floor})` : ""}
              </p>
              <p className="text-gray-600">{task.status}</p>
              {task.description && (
                <p className="text-gray-500">{task.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void completeTask(task.id)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-white hover:bg-green-700"
            >
              Mark complete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}