"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import {
  redirectForOnlineCheckout,
  startReservationOnlineCheckout,
} from "@/lib/checkout";
import type {
  PaymentMethod,
  ReservationPaymentsResponse,
} from "@/lib/payment-types";

interface ReservationPaymentsPanelProps {
  reservationId: string;
}

export function ReservationPaymentsPanel({
  reservationId,
}: ReservationPaymentsPanelProps) {
  const [data, setData] = useState<ReservationPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CASH" as PaymentMethod,
    notes: "",
  });

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await apiRequest<ReservationPaymentsResponse>(
        `/reservations/${reservationId}/payments`,
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load payments.",
      );
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function recordPayment(event: React.FormEvent) {
    event.preventDefault();
    setActionMessage("");

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionMessage("Enter a valid payment amount.");
      return;
    }

    try {
      await apiRequest(`/reservations/${reservationId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          method: paymentForm.method,
          notes: paymentForm.notes || undefined,
        }),
      });

      setPaymentForm({ amount: "", method: "CASH", notes: "" });
      setActionMessage("Payment recorded as pending.");
      await loadPayments();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Could not record payment.",
      );
    }
  }

  async function completePayment(paymentId: string) {
    setActionMessage("");
    try {
      await apiRequest(`/payments/${paymentId}/complete`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setActionMessage("Payment marked completed.");
      await loadPayments();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Could not complete payment.",
      );
    }
  }

  async function refundPayment(paymentId: string, partial?: boolean) {
    setActionMessage("");
    const amount = partial
      ? window.prompt("Partial refund amount:", "")
      : null;

    if (partial && (!amount || Number(amount) <= 0)) {
      return;
    }

    const reason =
      window.prompt("Refund reason (optional):", "") ?? undefined;

    try {
      await apiRequest(`/payments/${paymentId}/refund`, {
        method: "POST",
        body: JSON.stringify({
          ...(amount ? { amount: Number(amount) } : {}),
          ...(reason ? { reason } : {}),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setActionMessage("Refund processed.");
      await loadPayments();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Refund failed.",
      );
    }
  }

  async function startOnlineCheckout(provider: "STRIPE" | "PAYHERE") {
    setActionMessage("");
    const customerCity = window.prompt("Customer city:", "Colombo");
    if (!customerCity?.trim()) {
      return;
    }

    try {
      const result = await startReservationOnlineCheckout(reservationId, {
        provider,
        customerCity,
      });

      await redirectForOnlineCheckout(result);
      await loadPayments();
    } catch (err) {
      setActionMessage(
        err instanceof Error ? err.message : "Online checkout failed.",
      );
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading payments...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="mt-8 border-t pt-8">
      <h2 className="text-lg font-semibold">Payments</h2>

      <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
        <div>
          <span className="text-gray-500">Total</span>
          <p className="font-medium">
            {data.summary.totalAmount.toFixed(2)} {data.summary.currency}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Paid (net)</span>
          <p className="font-medium">
            {data.summary.paidAmount.toFixed(2)} {data.summary.currency}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Refunded</span>
          <p className="font-medium">
            {data.summary.refundedAmount.toFixed(2)} {data.summary.currency}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Balance</span>
          <p className="font-semibold text-blue-700">
            {data.summary.balance.toFixed(2)} {data.summary.currency}
          </p>
        </div>
      </div>

      {actionMessage && (
        <p className="mt-3 text-sm text-gray-600">{actionMessage}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void startOnlineCheckout("STRIPE")}
          className="rounded-lg border border-blue-600 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
        >
          Stripe checkout
        </button>
        <button
          type="button"
          onClick={() => void startOnlineCheckout("PAYHERE")}
          className="rounded-lg border border-emerald-600 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-50"
        >
          PayHere checkout
        </button>
      </div>

      <form
        onSubmit={(event) => void recordPayment(event)}
        className="mt-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-4"
      >
        <label className="text-sm sm:col-span-1">
          <span className="text-gray-600">Amount</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={paymentForm.amount}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                amount: event.target.value,
              })
            }
            className="mt-1 w-full rounded border px-2 py-1.5"
            required
          />
        </label>
        <label className="text-sm sm:col-span-1">
          <span className="text-gray-600">Method</span>
          <select
            value={paymentForm.method}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                method: event.target.value as PaymentMethod,
              })
            }
            className="mt-1 w-full rounded border px-2 py-1.5"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="text-gray-600">Notes</span>
          <input
            type="text"
            value={paymentForm.notes}
            onChange={(event) =>
              setPaymentForm({
                ...paymentForm,
                notes: event.target.value,
              })
            }
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </label>
        <div className="sm:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Record payment (pending)
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Method</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-gray-500">
                  No payments yet.
                </td>
              </tr>
            )}
            {data.payments.map((payment) => (
              <tr key={payment.id} className="border-b align-top">
                <td className="py-3 pr-3 text-gray-600">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
                <td className="py-3 pr-3">
                  {Number(payment.amount).toFixed(2)} {payment.currency}
                </td>
                <td className="py-3 pr-3">{payment.method}</td>
                <td className="py-3 pr-3">{payment.status}</td>
                <td className="py-3 pr-3 text-gray-600">
                  {payment.provider ?? "—"}
                  {payment.transactionId && (
                    <span className="block text-xs">
                      {payment.transactionId}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-col gap-1">
                    {(payment.status === "PENDING" ||
                      payment.status === "PROCESSING") && (
                      <button
                        type="button"
                        onClick={() => void completePayment(payment.id)}
                        className="text-left text-blue-600 underline"
                      >
                        Mark completed
                      </button>
                    )}
                    {(payment.status === "COMPLETED" ||
                      payment.status === "PARTIALLY_REFUNDED") && (
                      <>
                        <button
                          type="button"
                          onClick={() => void refundPayment(payment.id)}
                          className="text-left text-blue-600 underline"
                        >
                          Refund full
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void refundPayment(payment.id, true)
                          }
                          className="text-left text-blue-600 underline"
                        >
                          Partial refund
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}