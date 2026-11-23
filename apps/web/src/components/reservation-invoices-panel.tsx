"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  total: number | string;
  lineItems: InvoiceLineItem[];
}

interface ReservationInvoicesPanelProps {
  reservationId: string;
}

export function ReservationInvoicesPanel({
  reservationId,
}: ReservationInvoicesPanelProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiRequest<Invoice[]>(
        `/reservations/${reservationId}/invoices`,
      );
      setInvoices(result);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDraft() {
    setMessage("");
    try {
      await apiRequest(`/reservations/${reservationId}/invoices`, {
        method: "POST",
      });
      setMessage("Draft invoice created.");
      await load();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not create invoice.",
      );
    }
  }

  async function issueInvoice(invoiceId: string) {
    setMessage("");
    try {
      await apiRequest(`/invoices/${invoiceId}/issue`, { method: "POST" });
      setMessage("Invoice issued.");
      await load();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not issue invoice.",
      );
    }
  }

  async function syncPaid(invoiceId: string) {
    setMessage("");
    try {
      await apiRequest(`/invoices/${invoiceId}/sync-payment-status`, {
        method: "POST",
      });
      setMessage("Payment status synced.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed.");
    }
  }

  return (
    <section className="mt-8 border-t pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <button
          type="button"
          onClick={() => void createDraft()}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Create draft invoice
        </button>
      </div>

      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      {loading && (
        <p className="mt-2 text-sm text-gray-500">Loading invoices...</p>
      )}

      {!loading && invoices.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">No invoices yet.</p>
      )}

      <ul className="mt-4 space-y-3">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="rounded-lg border p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{invoice.invoiceNumber}</span>
              <span className="text-gray-600">{invoice.status}</span>
            </div>
            <p className="mt-1 text-gray-700">
              Total: {Number(invoice.total).toFixed(2)} {invoice.currency}
            </p>
            <ul className="mt-2 list-disc pl-5 text-gray-600">
              {invoice.lineItems.map((line, index) => (
                <li key={`${invoice.id}-${index}`}>
                  {line.description} — {Number(line.lineTotal).toFixed(2)}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-3">
              {invoice.status === "DRAFT" && (
                <button
                  type="button"
                  onClick={() => void issueInvoice(invoice.id)}
                  className="text-blue-600 underline"
                >
                  Issue
                </button>
              )}
              {invoice.status === "ISSUED" && (
                <button
                  type="button"
                  onClick={() => void syncPaid(invoice.id)}
                  className="text-blue-600 underline"
                >
                  Mark paid from payments
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}