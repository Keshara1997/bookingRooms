import {
  PaymentStatus,
  RefundStatus,
} from "../../generated/prisma/enums.js";
import type { Payment, PaymentRefund } from "../../generated/prisma/client.js";

export function amountToCents(value: unknown): number {
  return Math.round(Number(value) * 100);
}

export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

export function sumCompletedRefundsCents(
  refunds: Pick<PaymentRefund, "status" | "amount">[],
): number {
  return refunds
    .filter((refund) => refund.status === RefundStatus.COMPLETED)
    .reduce((total, refund) => total + amountToCents(refund.amount), 0);
}

export function paymentCountsTowardBalance(status: PaymentStatus): boolean {
  return (
    status === PaymentStatus.PENDING ||
    status === PaymentStatus.PROCESSING ||
    status === PaymentStatus.COMPLETED ||
    status === PaymentStatus.PARTIALLY_REFUNDED
  );
}

export function committedCentsForPayment(
  payment: Pick<Payment, "status" | "amount">,
  refunds: Pick<PaymentRefund, "status" | "amount">[],
): number {
  if (!paymentCountsTowardBalance(payment.status)) {
    return 0;
  }

  const grossCents = amountToCents(payment.amount);

  if (
    payment.status === PaymentStatus.COMPLETED ||
    payment.status === PaymentStatus.PARTIALLY_REFUNDED
  ) {
    return Math.max(0, grossCents - sumCompletedRefundsCents(refunds));
  }

  return grossCents;
}

export function netPaidCents(
  payments: Pick<Payment, "id" | "status" | "amount">[],
  refundsByPaymentId: Map<
    string,
    Pick<PaymentRefund, "status" | "amount">[]
  >,
): number {
  return payments.reduce(
    (total, payment) =>
      total +
      committedCentsForPayment(
        payment,
        refundsByPaymentId.get(payment.id) ?? [],
      ),
    0,
  );
}

export function groupRefundsByPaymentId(
  refunds: Pick<PaymentRefund, "paymentId" | "status" | "amount">[],
): Map<string, Pick<PaymentRefund, "status" | "amount">[]> {
  const map = new Map<
    string,
    Pick<PaymentRefund, "status" | "amount">[]
  >();

  for (const refund of refunds) {
    const list = map.get(refund.paymentId) ?? [];
    list.push(refund);
    map.set(refund.paymentId, list);
  }

  return map;
}