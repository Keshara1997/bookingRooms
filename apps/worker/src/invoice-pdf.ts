import PDFDocument from "pdfkit";

export interface InvoicePdfLine {
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export function buildInvoicePdf(input: {
  invoiceNumber: string;
  currency: string;
  total: string;
  guestName: string;
  hotelName: string;
  confirmationCode: string;
  lineItems: InvoicePdfLine[];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Invoice");
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`Invoice: ${input.invoiceNumber}`);
    doc.text(`Hotel: ${input.hotelName}`);
    doc.text(`Reservation: ${input.confirmationCode}`);
    doc.text(`Guest: ${input.guestName}`);
    doc.moveDown();
    for (const line of input.lineItems) {
      doc.text(
        `${line.description} — ${line.lineTotal} ${input.currency}`,
      );
    }
    doc.moveDown();
    doc.fontSize(12).text(`Total: ${input.total} ${input.currency}`);

    doc.end();
  });
}