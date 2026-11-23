
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    ServiceUnavailableException,
  } from "@nestjs/common";
  
  import { ConfigService } from "@nestjs/config";
  
  import {
    createHmac,
    timingSafeEqual,
  } from "node:crypto";
  
  import {
    CreateProviderPaymentInput,
    PaymentProvider,
    ProviderCheckoutResult,
    RefundProviderPaymentInput,
    RefundProviderPaymentResult,
    VerifyProviderPaymentInput,
    VerifyProviderPaymentResult,
  } from "./payment-provider.interface.js";
  
  // ============================================
  // STRIPE PROVIDER
  // ============================================
  
  @Injectable()
  export class StripeProvider implements PaymentProvider {
    readonly name = "STRIPE" as const;
  
    private readonly apiUrl = "https://api.stripe.com/v1";
  
    constructor(
      private readonly config: ConfigService,
    ) {}
  
    // ==========================================
    // CONFIGURATION
    // ==========================================
  
    private get secretKey(): string {
      const value = this.config.get<string>("STRIPE_SECRET_KEY");
  
      if (!value) {
        throw new InternalServerErrorException(
          "Stripe secret key is not configured.",
        );
      }
  
      return value;
    }
  
    private get webhookSecret(): string {
      const value = this.config.get<string>(
        "STRIPE_WEBHOOK_SECRET",
      );
  
      if (!value) {
        throw new InternalServerErrorException(
          "Stripe webhook secret is not configured.",
        );
      }
  
      return value;
    }
  
    // ==========================================
    // STRIPE API REQUEST
    // ==========================================
  
    private async request(
      path: string,
      body: URLSearchParams,
    ): Promise<Record<string, any>> {
      const response = await fetch(`${this.apiUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
  
      const result = await response.json() as Record<string, any>;
  
      if (!response.ok) {
        const message =
          result.error?.message ??
          "Stripe API request failed.";
  
        throw new ServiceUnavailableException(message);
      }
  
      return result;
    }
  
    // ==========================================
    // CREATE CHECKOUT SESSION
    // ==========================================
  
    async createCheckout(
      input: CreateProviderPaymentInput,
    ): Promise<ProviderCheckoutResult> {
      if (!input.customer.email) {
        throw new BadRequestException(
          "A customer email address is required for Stripe Checkout.",
        );
      }
  
      const currency = input.currency.toLowerCase();
  
      const amountInMinorUnits = Math.round(input.amount * 100);
  
      if (amountInMinorUnits <= 0) {
        throw new BadRequestException(
          "Stripe payment amount must be greater than zero.",
        );
      }
  
      const body = new URLSearchParams();
  
      body.set("mode", "payment");
      body.set("success_url", input.returnUrl);
      body.set("cancel_url", input.cancelUrl);
      body.set("customer_email", input.customer.email);
  
      body.set(
        "line_items[0][price_data][currency]",
        currency,
      );
  
      body.set(
        "line_items[0][price_data][product_data][name]",
        `bookingRooms reservation ${input.reservationId}`,
      );
  
      body.set(
        "line_items[0][price_data][unit_amount]",
        String(amountInMinorUnits),
      );
  
      body.set("line_items[0][quantity]", "1");
  
      body.set(
        "metadata[payment_id]",
        input.paymentId,
      );
  
      body.set(
        "metadata[reservation_id]",
        input.reservationId,
      );
  
      body.set(
        "payment_intent_data[metadata][payment_id]",
        input.paymentId,
      );
  
      body.set(
        "payment_intent_data[metadata][reservation_id]",
        input.reservationId,
      );
  
      const session = await this.request(
        "/checkout/sessions",
        body,
      );
  
      if (!session.url || !session.id) {
        throw new ServiceUnavailableException(
          "Stripe did not return a Checkout Session URL.",
        );
      }
  
      return {
        provider: this.name,
        checkoutUrl: session.url,
        providerReference: session.id,
      };
    }
  
    // ==========================================
    // VERIFY STRIPE WEBHOOK
    // ==========================================
  
    async verifyPayment(
      input: VerifyProviderPaymentInput,
    ): Promise<VerifyProviderPaymentResult> {
      if (!input.rawBody || !input.signature) {
        return {
          valid: false,
          status: "FAILED",
          message: "Stripe webhook body or signature is missing.",
        };
      }
  
      const signatureParts = input.signature
        .split(",")
        .map((part) => part.split("=", 2));
  
      const timestamp = signatureParts.find(
        ([key]) => key === "t",
      )?.[1];
  
      const signatures = signatureParts
        .filter(([key]) => key === "v1")
        .map(([, value]) => value);
  
      if (!timestamp || signatures.length === 0) {
        return {
          valid: false,
          status: "FAILED",
          message: "Stripe webhook signature format is invalid.",
        };
      }
  
      const timestampNumber = Number(timestamp);
  
      if (
        !Number.isFinite(timestampNumber) ||
        Math.abs(Date.now() / 1000 - timestampNumber) > 300
      ) {
        return {
          valid: false,
          status: "FAILED",
          message: "Stripe webhook timestamp is outside the allowed tolerance.",
        };
      }
  
      const expectedSignature = createHmac(
        "sha256",
        this.webhookSecret,
      )
        .update(`${timestamp}.${input.rawBody}`, "utf8")
        .digest("hex");
  
      const expectedBuffer = Buffer.from(
        expectedSignature,
        "hex",
      );
  
      const signatureMatches = signatures.some((signature) => {
        const receivedBuffer = Buffer.from(signature, "hex");
  
        return (
          receivedBuffer.length === expectedBuffer.length &&
          timingSafeEqual(receivedBuffer, expectedBuffer)
        );
      });
  
      if (!signatureMatches) {
        return {
          valid: false,
          status: "FAILED",
          message: "Stripe webhook signature verification failed.",
        };
      }
  
      let event: Record<string, any>;
  
      try {
        event = JSON.parse(input.rawBody);
      } catch {
        return {
          valid: false,
          status: "FAILED",
          message: "Stripe webhook body is invalid JSON.",
        };
      }
  
      const session = event.data?.object;
  
      if (
        !session ||
        session.metadata?.payment_id !== input.paymentId
      ) {
        return {
          valid: false,
          status: "FAILED",
          message: "Stripe payment metadata does not match.",
        };
      }
  
      let status: "PROCESSING" | "COMPLETED" | "FAILED";
  
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        status =
          session.payment_status === "paid" ||
          event.type === "checkout.session.async_payment_succeeded"
            ? "COMPLETED"
            : "PROCESSING";
      } else if (
        event.type === "checkout.session.async_payment_failed"
      ) {
        status = "FAILED";
      } else {
        status = "PROCESSING";
      }
  
      const amount =
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : undefined;
  
      const currency =
        typeof session.currency === "string"
          ? session.currency.toUpperCase()
          : undefined;
  
      const transactionId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
  
      return {
        valid: true,
        status,
        transactionId,
        amount,
        currency,
        message: event.type,
      };
    }
  
    // ==========================================
    // REFUND PAYMENT
    // ==========================================
  
    async refundPayment(
      input: RefundProviderPaymentInput,
    ): Promise<RefundProviderPaymentResult> {
      const body = new URLSearchParams();
  
      body.set("payment_intent", input.transactionId);
  
      if (input.amount !== undefined) {
        body.set(
          "amount",
          String(Math.round(input.amount * 100)),
        );
      }
  
      if (input.reason) {
        body.set(
          "metadata[refund_reason]",
          input.reason,
        );
      }
  
      const refund = await this.request(
        "/refunds",
        body,
      );
  
      return {
        successful:
          refund.status === "succeeded" ||
          refund.status === "pending",
        providerReference: refund.id,
        message: refund.status,
      };
    }
  }
  