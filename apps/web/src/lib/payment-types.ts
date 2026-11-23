export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "ONLINE"
  | "OTHER";

export interface PaymentRefund {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  providerRefundId?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider?: string | null;
  transactionId?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  refunds?: PaymentRefund[];
}

export interface ReservationPaymentsResponse {
  reservation: {
    id: string;
    confirmationCode: string;
    totalAmount: number | string;
    currency: string;
  };
  payments: Payment[];
  summary: {
    totalAmount: number;
    paidAmount: number;
    refundedAmount: number;
    balance: number;
    currency: string;
  };
}