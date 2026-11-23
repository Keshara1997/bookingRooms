"use client";

import Link from "next/link";

export default function InvoicesPage() {
  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Invoices</h1>
      <p className="mt-2 text-sm text-gray-500">
        Invoices are created per reservation. Open a booking, use{" "}
        <strong>Invoices</strong> to draft, issue, and mark paid when payments
        match the total.
      </p>
      <Link
        href="/dashboard/reservations"
        className="mt-4 inline-block text-sm text-blue-600 underline"
      >
        Go to reservations
      </Link>
    </main>
  );
}