"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api";
import type { Branch } from "@/lib/hotel-types";

export default function NewBranchPage() {
  const params = useParams<{ hotelId: string }>();
  const router = useRouter();
  const hotelId = params.hotelId;

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    city: "",
    country: "Sri Lanka",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

      await apiRequest<Branch>(
        `/hotels/${hotelId}/branches`,
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            code: form.code.trim().toUpperCase(),
          }),
        },
      );

      router.push(`/dashboard/hotels/${hotelId}/branches`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create branch.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Create Branch</h1>

      <p className="mb-8 mt-2 text-gray-500">
        Add a new branch to this hotel.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6"
      >
        <div>
          <label className="mb-2 block font-medium">Branch Name *</label>
          <input
            required
            name="name"
            value={form.name}
            onChange={updateField}
            minLength={2}
            maxLength={150}
            className="w-full rounded-lg border p-3"
            placeholder="Example: Kandy Branch"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Branch Code *</label>
          <input
            required
            name="code"
            value={form.code}
            onChange={updateField}
            minLength={2}
            maxLength={30}
            className="w-full rounded-lg border p-3 uppercase"
            placeholder="Example: KDY001"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            maxLength={500}
            rows={3}
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
            {loading ? "Creating..." : "Create Branch"}
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