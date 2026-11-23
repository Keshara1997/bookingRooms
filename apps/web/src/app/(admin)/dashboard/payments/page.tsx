"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

interface ReconciliationRow {
  id: string;
  confirmationCode: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  provider?: string | null;
  transactionId?: string | null;
  refundableRemaining: number;
  refunds: {
    id: string;
    amount: number;
    status: string;
    providerRefundId?: string | null;
  }[];
}

export default function PaymentsPage() {
  const [rows, setRows] = useState<ReconciliationRow[]>([]);
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (provider) {
        params.set("provider", provider);
      }
      const path = params.size
        ? `/payments/reconciliation?${params}`
        : "/payments/reconciliation";
      const result = await apiRequest<ReconciliationRow[]>(path);
      setRows(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load payments.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="mt-1 text-sm text-gray-500">
        Reconciliation view (recent payments). Manage payments on a{" "}
        <Link href="/dashboard/reservations" className="text-blue-600 underline">
          reservation
        </Link>
        .
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="text-gray-600">Provider</span>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2"
          >
            <option value="">All</option>
            <option value="STRIPE">Stripe</option>
            <option value="PAYHERE">PayHere</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}
      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-2 pr-2">Booking</th>
                <th className="py-2 pr-2">Amount</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Provider</th>
                <th className="py-2 pr-2">Refunds</th>
                <th className="py-2 pr-2">Refundable left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="py-3 pr-2">{row.confirmationCode}</td>
                  <td className="py-3 pr-2">
                    {row.amount.toFixed(2)} {row.currency}
                  </td>
                  <td className="py-3 pr-2">{row.status}</td>
                  <td className="py-3 pr-2 text-xs text-gray-600">
                    {row.provider ?? "—"}
                    {row.transactionId && (
                      <span className="block">{row.transactionId}</span>
                    )}
                  </td>
                  <td className="py-3 pr-2">
                    {row.refunds.length === 0
                      ? "—"
                      : row.refunds
                          .map(
                            (r) =>
                              `${r.amount.toFixed(2)} (${r.status})`,
                          )
                          .join(", ")}
                  </td>
                  <td className="py-3 pr-2">
                    {row.refundableRemaining.toFixed(2)} {row.currency}
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