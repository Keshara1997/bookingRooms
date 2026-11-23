import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { InvoiceStatus } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../database/prisma.service.js";
import {
  amountToCents,
  centsToAmount,
  groupRefundsByPaymentId,
  netPaidCents,
} from "../payments/payments-balance.util.js";

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `INV-${year}-`;

    const count = await this.prisma.invoice.count({
      where: {
        tenantId,
        invoiceNumber: { startsWith: prefix },
      },
    });

    return `${prefix}${String(count + 1).padStart(5, "0")}`;
  }

  async createDraftFromReservation(
    tenantId: string,
    reservationId: string,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        tenantId,
      },
      include: {
        rooms: {
          include: {
            roomType: true,
          },
        },
        guest: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException("Reservation not found.");
    }

    const invoiceNumber = await this.nextInvoiceNumber(tenantId);
    const subtotal = Number(reservation.totalAmount);
    const taxTotal = 0;
    const total = subtotal + taxTotal;

    const lineItems = reservation.rooms.map((line) => ({
      description: `Room: ${line.roomType.name} (${reservation.confirmationCode})`,
      quantity: 1,
      unitPrice: line.nightlyRate.toFixed(2),
      lineTotal: line.nightlyRate.toFixed(2),
    }));

    if (lineItems.length === 0) {
      lineItems.push({
        description: `Stay ${reservation.confirmationCode}`,
        quantity: 1,
        unitPrice: subtotal.toFixed(2),
        lineTotal: subtotal.toFixed(2),
      });
    }

    return this.prisma.invoice.create({
      data: {
        tenantId,
        reservationId,
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        currency: reservation.currency,
        subtotal: subtotal.toFixed(2),
        taxTotal: taxTotal.toFixed(2),
        total: total.toFixed(2),
        lineItems: {
          create: lineItems,
        },
      },
      include: {
        lineItems: true,
        reservation: {
          select: {
            confirmationCode: true,
            guest: true,
          },
        },
      },
    });
  }

  async findByReservation(tenantId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        tenantId,
      },
      select: { id: true },
    });

    if (!reservation) {
      throw new NotFoundException("Reservation not found.");
    }

    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        reservationId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        lineItems: true,
      },
    });
  }

  async findOne(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      include: {
        lineItems: true,
        reservation: {
          include: {
            guest: true,
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException("Invoice not found.");
    }

    return invoice;
  }

  async issue(tenantId: string, invoiceId: string) {
    const invoice = await this.findOne(tenantId, invoiceId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException("Only draft invoices can be issued.");
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
      include: { lineItems: true },
    });
  }

  async syncPaymentStatus(tenantId: string, invoiceId: string) {
    const invoice = await this.findOne(tenantId, invoiceId);
    const reservation = invoice.reservation;

    const refunds = await this.prisma.paymentRefund.findMany({
      where: {
        tenantId,
        paymentId: { in: reservation.payments.map((p) => p.id) },
      },
      select: {
        paymentId: true,
        status: true,
        amount: true,
      },
    });

    const netPaid = netPaidCents(
      reservation.payments,
      groupRefundsByPaymentId(refunds),
    );
    const totalCents = amountToCents(invoice.total);

    if (netPaid >= totalCents && invoice.status === InvoiceStatus.ISSUED) {
      return this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
        include: { lineItems: true },
      });
    }

    if (
      netPaid < totalCents &&
      invoice.status === InvoiceStatus.PAID
    ) {
      return this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.ISSUED,
          paidAt: null,
        },
        include: { lineItems: true },
      });
    }

    return invoice;
  }

  async syncInvoicesForReservation(
    tenantId: string,
    reservationId: string,
  ) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        reservationId,
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.PAID],
        },
      },
      select: { id: true },
    });

    for (const invoice of invoices) {
      await this.syncPaymentStatus(tenantId, invoice.id);
    }
  }
}