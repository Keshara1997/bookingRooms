
export type PaymentProviderName = "PAYHERE" | "STRIPE";

export type ExternalPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface ProviderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface CreateProviderPaymentInput {
  paymentId: string;
  reservationId: string;
  amount: number;
  currency: string;
  customer: ProviderCustomer;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}

export interface ProviderCheckoutResult {
  provider: PaymentProviderName;
  checkoutUrl: string;
  providerReference?: string;
  formFields?: Record<string, string>;
}

export interface VerifyProviderPaymentInput {
  paymentId: string;
  providerReference: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  signature?: string;
  rawBody?: string;
  rawPayload?: Record<string, unknown>;
}

export interface VerifyProviderPaymentResult {
  valid: boolean;
  status: ExternalPaymentStatus;
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
}

export interface RefundProviderPaymentInput {
  paymentId: string;
  transactionId: string;
  amount?: number;
  currency: string;
  reason?: string;
}

export interface RefundProviderPaymentResult {
  successful: boolean;
  providerReference?: string;
  message?: string;
}

// ============================================
// PAYMENT PROVIDER CONTRACT
// ============================================

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  createCheckout(
    input: CreateProviderPaymentInput,
  ): Promise<ProviderCheckoutResult>;

  verifyPayment(
    input: VerifyProviderPaymentInput,
  ): Promise<VerifyProviderPaymentResult>;

  refundPayment(
    input: RefundProviderPaymentInput,
  ): Promise<RefundProviderPaymentResult>;
}



export const PAYMENT_PROVIDERS = "PAYMENT_PROVIDERS";