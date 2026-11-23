
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    ServiceUnavailableException,
  } from "@nestjs/common";
  
  import { ConfigService } from "@nestjs/config";
  
  import {
    createHash,
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
  // PAYHERE PROVIDER
  // ============================================
  
  @Injectable()
  export class PayHereProvider implements PaymentProvider {
    readonly name = "PAYHERE" as const;
  
    constructor(
      private readonly config: ConfigService,
    ) {}
  
    // ==========================================
    // CONFIGURATION
    // ==========================================
  
    private get isSandbox(): boolean {
      return this.config.get<string>("PAYHERE_SANDBOX", "true") === "true";
    }
  
    private get baseUrl(): string {
      return this.isSandbox
        ? "https://sandbox.payhere.lk"
        : "https://www.payhere.lk";
    }
  
    private get merchantId(): string {
      const value = this.config.get<string>("PAYHERE_MERCHANT_ID");
  
      if (!value) {
        throw new InternalServerErrorException(
          "PayHere merchant ID is not configured.",
        );
      }
  
      return value;
    }
  
    private get merchantSecret(): string {
      const value = this.config.get<string>("PAYHERE_MERCHANT_SECRET");
  
      if (!value) {
        throw new InternalServerErrorException(
          "PayHere merchant secret is not configured.",
        );
      }
  
      return value;
    }
  
    private md5(value: string): string {
      return createHash("md5")
        .update(value, "utf8")
        .digest("hex")
        .toUpperCase();
    }
  
    // ==========================================
    // GENERATE CHECKOUT HASH
    // ==========================================
  
    private generateCheckoutHash(
      orderId: string,
      amount: string,
      currency: string,
    ): string {
      const hashedSecret = this.md5(this.merchantSecret);
  
      return this.md5(
        this.merchantId +
          orderId +
          amount +
          currency +
          hashedSecret,
      );
    }
  
    // ==========================================
    // CREATE CHECKOUT
    // ==========================================
  
    async createCheckout(
      input: CreateProviderPaymentInput,
    ): Promise<ProviderCheckoutResult> {
      if (
        !input.customer.email ||
        !input.customer.phone ||
        !input.customer.address ||
        !input.customer.city ||
        !input.customer.country
      ) {
        throw new BadRequestException(
          "PayHere requires customer email, phone, address, city and country.",
        );
      }
  
      if (!["LKR", "USD"].includes(input.currency.toUpperCase())) {
        throw new BadRequestException(
          "PayHere checkout supports LKR and USD in this integration.",
        );
      }
  
      const amount = input.amount.toFixed(2);
      const currency = input.currency.toUpperCase();
  
      const fields: Record<string, string> = {
        merchant_id: this.merchantId,
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        notify_url: input.notifyUrl,
  
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        email: input.customer.email,
        phone: input.customer.phone,
        address: input.customer.address,
        city: input.customer.city,
        country: input.customer.country,
  
        order_id: input.paymentId,
        items: `bookingRooms reservation ${input.reservationId}`,
        currency,
        amount,
  
        hash: this.generateCheckoutHash(
          input.paymentId,
          amount,
          currency,
        ),
      };
  
      return {
        provider: this.name,
        checkoutUrl: `${this.baseUrl}/pay/checkout`,
        providerReference: input.paymentId,
        formFields: fields,
      };
    }
  
    // ==========================================
    // VERIFY PAYMENT NOTIFICATION
    // ==========================================
  
    async verifyPayment(
      input: VerifyProviderPaymentInput,
    ): Promise<VerifyProviderPaymentResult> {
      const payload = input.rawPayload;
  
      if (!payload) {
        return {
          valid: false,
          status: "FAILED",
          message: "PayHere notification payload is missing.",
        };
      }
  
      const merchantId = String(payload.merchant_id ?? "");
      const orderId = String(payload.order_id ?? "");
      const amount = String(payload.payhere_amount ?? "");
      const currency = String(payload.payhere_currency ?? "");
      const statusCode = String(payload.status_code ?? "");
      const receivedSignature = String(payload.md5sig ?? "");
      const transactionId = String(payload.payment_id ?? "");
  
      if (
        merchantId !== this.merchantId ||
        orderId !== input.paymentId ||
        !amount ||
        !currency ||
        !statusCode ||
        !receivedSignature
      ) {
        return {
          valid: false,
          status: "FAILED",
          message: "PayHere notification fields are invalid.",
        };
      }
  
      const hashedSecret = this.md5(this.merchantSecret);
  
      const expectedSignature = this.md5(
        merchantId +
          orderId +
          amount +
          currency +
          statusCode +
          hashedSecret,
      );
  
      const receivedBuffer = Buffer.from(
        receivedSignature.toUpperCase(),
        "utf8",
      );
  
      const expectedBuffer = Buffer.from(
        expectedSignature,
        "utf8",
      );
  
      const signatureMatches =
        receivedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(receivedBuffer, expectedBuffer);
  
      if (!signatureMatches) {
        return {
          valid: false,
          status: "FAILED",
          message: "PayHere notification signature verification failed.",
        };
      }
  
      const receivedAmount = Number(amount);
  
      if (
        !Number.isFinite(receivedAmount) ||
        (input.amount !== undefined &&
          Math.round(receivedAmount * 100) !==
            Math.round(input.amount * 100)) ||
        (input.currency &&
          currency.toUpperCase() !== input.currency.toUpperCase())
      ) {
        return {
          valid: false,
          status: "FAILED",
          message: "PayHere payment amount or currency does not match.",
        };
      }
  
      const status =
        statusCode === "2"
          ? "COMPLETED"
          : statusCode === "0"
            ? "PROCESSING"
            : "FAILED";
  
      return {
        valid: true,
        status,
        transactionId,
        amount: receivedAmount,
        currency: currency.toUpperCase(),
        message: String(payload.status_message ?? ""),
      };
    }
  
    // ==========================================
    // GET PAYHERE ACCESS TOKEN
    // ==========================================
  
    private async getAccessToken(): Promise<string> {
      const appId = this.config.get<string>("PAYHERE_APP_ID");
      const appSecret = this.config.get<string>("PAYHERE_APP_SECRET");
  
      if (!appId || !appSecret) {
        throw new InternalServerErrorException(
          "PayHere refund API credentials are not configured.",
        );
      }
  
      const authorization = Buffer.from(
        `${appId}:${appSecret}`,
      ).toString("base64");
  
      const response = await fetch(
        `${this.baseUrl}/merchant/v1/oauth/token`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authorization}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
          }),
        },
      );
  
      if (!response.ok) {
        throw new ServiceUnavailableException(
          "Unable to authenticate with PayHere refund API.",
        );
      }
  
      const result = await response.json() as {
        access_token?: string;
      };
  
      if (!result.access_token) {
        throw new ServiceUnavailableException(
          "PayHere did not return an access token.",
        );
      }
  
      return result.access_token;
    }
  
    // ==========================================
    // REFUND PAYMENT
    // ==========================================
  
    async refundPayment(
      input: RefundProviderPaymentInput,
    ): Promise<RefundProviderPaymentResult> {
      const accessToken = await this.getAccessToken();
  
      const body: Record<string, string | number> = {
        payment_id: input.transactionId,
        description: input.reason ?? "bookingRooms reservation refund",
      };
  
      // PayHere interprets an amount as a partial refund amount.
      // Omitting it requests a full refund.
      if (input.amount !== undefined) {
        body.amount = input.amount.toFixed(2);
      }
  
      const response = await fetch(
        `${this.baseUrl}/merchant/v1/payment/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
  
      if (!response.ok) {
        throw new ServiceUnavailableException(
          "PayHere refund request could not be completed.",
        );
      }
  
      const result = await response.json() as {
        status?: number;
        msg?: string;
        data?: string | number | null;
      };
  
      return {
        successful: result.status === 1,
        providerReference:
          result.data === null || result.data === undefined
            ? undefined
            : String(result.data),
        message: result.msg,
      };
    }
  }
  