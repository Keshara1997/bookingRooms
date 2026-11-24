import "dotenv/config";

import { Worker } from "bullmq";
import IORedis from "ioredis";

import { buildInvoicePdf } from "./invoice-pdf.js";
import { sendMail } from "./mail.js";

const QUEUE_NAME = "bookingrooms-notifications";

const redisUrl =
  process.env.REDIS_URL ?? "redis://:horilla_redis_pass@127.0.0.1:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

interface ReservationConfirmedJob {
  confirmationCode: string;
  guestEmail?: string | null;
  guestName: string;
  hotelName: string;
  branchName: string;
  checkIn: string;
  checkOut: string;
  currency: string;
  totalAmount: string;
}

interface InvoiceIssuedJob {
  invoiceNumber: string;
  guestEmail?: string | null;
  guestName: string;
  hotelName: string;
  confirmationCode: string;
  currency: string;
  total: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(
      `[${new Date().toISOString()}] ${job.name}`,
      JSON.stringify(job.data),
    );

    if (job.name === "reservation.confirmed") {
      const data = job.data as ReservationConfirmedJob;
      const text = [
        `Hello ${data.guestName},`,
        "",
        `Your stay at ${data.hotelName} (${data.branchName}) is confirmed.`,
        `Confirmation code: ${data.confirmationCode}`,
        `Check-in: ${data.checkIn}`,
        `Check-out: ${data.checkOut}`,
        `Total: ${data.totalAmount} ${data.currency}`,
        "",
        "Thank you for booking with us.",
      ].join("\n");

      if (data.guestEmail) {
        await sendMail({
          to: data.guestEmail,
          subject: `Reservation confirmed — ${data.confirmationCode}`,
          text,
        });
      } else {
        console.log(
          `[mail:skip] No guest email for confirmation ${data.confirmationCode}`,
        );
      }
    }

    if (job.name === "invoice.issued") {
      const data = job.data as InvoiceIssuedJob;
      const pdf = await buildInvoicePdf(data);
      const text = [
        `Hello ${data.guestName},`,
        "",
        `Invoice ${data.invoiceNumber} for reservation ${data.confirmationCode} is attached.`,
        `Total due: ${data.total} ${data.currency}`,
      ].join("\n");

      if (data.guestEmail) {
        await sendMail({
          to: data.guestEmail,
          subject: `Invoice ${data.invoiceNumber} — ${data.hotelName}`,
          text,
          attachments: [
            {
              filename: `${data.invoiceNumber}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ],
        });
      } else {
        console.log(
          `[mail:skip] No guest email for invoice ${data.invoiceNumber}`,
        );
      }
    }
  },
  { connection },
);

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

console.log(`bookingRooms worker listening on queue "${QUEUE_NAME}"`);