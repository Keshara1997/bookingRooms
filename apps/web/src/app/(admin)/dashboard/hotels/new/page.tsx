"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import type { Hotel } from "@/lib/hotel-types";

export default function NewHotelPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    country: "Sri Lanka",
    currency: "LKR",
    timezone: "Asia/Colombo",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const hotel = await apiRequest<Hotel>("/hotels", {
        method: "POST",
        body: JSON.stringify(form),
      });

      router.push(`/dashboard/hotels/${hotel.id}/branches`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create hotel.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Create Hotel</h1>
      <p className="mb-8 mt-2 text-gray-500">
        Enter your new property's information.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6"
      >
        <div>
          <label className="mb-2 block font-medium">Hotel Name *</label>
          <input
            required
            name="name"
            value={form.name}
            onChange={updateField}
            minLength={2}
            maxLength={150}
            className="w-full rounded-lg border p-3"
            placeholder="Example: StarBREW Hotel"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Contact Phone</label>
            <input
              name="contactPhone"
              value={form.contactPhone}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">City</label>
            <input
              name="city"
              value={form.city}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Currency</label>
            <select
              name="currency"
              value={form.currency}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            >
              <option value="LKR">LKR - Sri Lankan Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Timezone</label>
            <input
              name="timezone"
              value={form.timezone}
              onChange={updateField}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Hotel"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border px-6 py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}