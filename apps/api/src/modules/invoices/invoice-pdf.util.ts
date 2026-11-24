import PDFDocument from "pdfkit";

export interface InvoicePdfLine {
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface InvoicePdfInput {
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  issuedAt?: Date | null;
  guestName: string;
  guestEmail?: string | null;
  confirmationCode: string;
  hotelName: string;
  lineItems: InvoicePdfLine[];
}

export function buildInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333");

    doc.text(`Invoice number: ${input.invoiceNumber}`);
    doc.text(`Status: ${input.status}`);
    if (input.issuedAt) {
      doc.text(
        `Issued: ${input.issuedAt.toISOString().slice(0, 10)}`,
      );
    }
    doc.text(`Hotel: ${input.hotelName}`);
    doc.text(`Reservation: ${input.confirmationCode}`);
    doc.text(`Guest: ${input.guestName}`);
    if (input.guestEmail) {
      doc.text(`Email: ${input.guestEmail}`);
    }

    doc.moveDown();
    doc.fontSize(12).text("Line items", { underline: true });
    doc.moveDown(0.5);

    for (const line of input.lineItems) {
      doc.fontSize(10).text(
        `${line.description} — qty ${line.quantity} × ${line.unitPrice} ${input.currency} = ${line.lineTotal} ${input.currency}`,
      );
    }

    doc.moveDown();
    doc.text(`Subtotal: ${input.subtotal} ${input.currency}`);
    doc.text(`Tax: ${input.taxTotal} ${input.currency}`);
    doc.fontSize(12).text(`Total: ${input.total} ${input.currency}`, {
      underline: true,
    });

    doc.end();
  });
}