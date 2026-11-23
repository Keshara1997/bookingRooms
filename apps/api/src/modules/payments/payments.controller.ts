
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import { PaymentMethod } from "../../generated/prisma/enums.js";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { PaymentsService } from "./payments.service.js";
import { PaymentProviderName } from "./providers/payment-provider.interface.js";

// ============================================
// CREATE PAYMENT DTO
// ============================================

class CreatePaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

class CreateOnlineCheckoutDto {
  @IsIn(["PAYHERE", "STRIPE"])
  provider: PaymentProviderName;

  @IsUrl({ require_tld: false })
  returnUrl: string;

  @IsUrl({ require_tld: false })
  cancelUrl: string;

  @IsUrl({ require_tld: false })
  notifyUrl: string;

  @IsString()
  @IsNotEmpty()
  customerCity: string;
}

// ============================================
// COMPLETE PAYMENT DTO
// ============================================

class CompletePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionId?: string;
}

// ============================================
// PAYMENT REASON DTO
// ============================================

class PaymentReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

class RefundPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  idempotencyKey?: string;
}

@Controller("payments/webhooks")
export class StripeWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    if (!request.rawBody) {
      throw new BadRequestException(
        "Stripe raw request body is unavailable. Enable rawBody in main.ts.",
      );
    }

    return this.paymentsService.handleStripeWebhook(
      request.rawBody.toString("utf8"),
      signature,
    );
  }
}

@Controller("payments/webhooks")
export class PayHereWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post("payhere")
  @HttpCode(HttpStatus.OK)
  async handlePayHereNotification(
    @Body() body: Record<string, unknown>,
  ) {
    return this.paymentsService.handlePayHereNotification(body);
  }
}

// ============================================
// PAYMENTS CONTROLLER
// ============================================

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  // ==========================================
  // CREATE PAYMENT
  // POST /api/v1/reservations/:reservationId/payments
  // ==========================================

  @Post("reservations/:reservationId/payments")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
  create(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      tenantId,
      reservationId,
      dto,
    );
  }

  // ==========================================
  // GET RESERVATION PAYMENTS
  // GET /api/v1/reservations/:reservationId/payments
  // ==========================================

  @Get("reservations/:reservationId/payments")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
    "ACCOUNTANT",
  )
  findByReservation(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
  ) {
    return this.paymentsService.findByReservation(
      tenantId,
      reservationId,
    );
  }

  // ==========================================
  // GET PAYMENT DETAILS
  // GET /api/v1/payments/:paymentId
  // ==========================================

  @Get("payments/reconciliation")
  @Roles("OWNER", "ADMIN", "ACCOUNTANT")
  getReconciliation(
    @CurrentTenant() tenantId: string,
    @Query("provider") provider?: string,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;

    return this.paymentsService.getReconciliation(tenantId, {
      provider,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @Get("payments/:paymentId")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
    "ACCOUNTANT",
  )
  findOne(
    @CurrentTenant() tenantId: string,
    @Param("paymentId") paymentId: string,
  ) {
    return this.paymentsService.findOne(
      tenantId,
      paymentId,
    );
  }

  // ==========================================
  // MARK PAYMENT AS PROCESSING
  // POST /api/v1/payments/:paymentId/processing
  // ==========================================

  @Post("payments/:paymentId/processing")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
  markProcessing(
    @CurrentTenant() tenantId: string,
    @Param("paymentId") paymentId: string,
  ) {
    return this.paymentsService.markProcessing(
      tenantId,
      paymentId,
    );
  }

  // ==========================================
  // COMPLETE PAYMENT
  // POST /api/v1/payments/:paymentId/complete
  // ==========================================

  @Post("payments/:paymentId/complete")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "ACCOUNTANT")
  complete(
    @CurrentTenant() tenantId: string,
    @Param("paymentId") paymentId: string,
    @Body() dto: CompletePaymentDto,
  ) {
    return this.paymentsService.complete(
      tenantId,
      paymentId,
      dto.transactionId,
    );
  }

  @Post("reservations/:reservationId/payments/online-checkout")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
  )
  createOnlineCheckout(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
    @Body() dto: CreateOnlineCheckoutDto,
  ) {
    return this.paymentsService.createOnlineCheckout(
      tenantId,
      reservationId,
      dto.provider,
      {
        returnUrl: dto.returnUrl,
        cancelUrl: dto.cancelUrl,
        notifyUrl: dto.notifyUrl,
        customerCity: dto.customerCity,
      },
    );
  }

  // ==========================================
  // FAIL PAYMENT
  // POST /api/v1/payments/:paymentId/fail
  // ==========================================

  @Post("payments/:paymentId/fail")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "ACCOUNTANT")
  fail(
    @CurrentTenant() tenantId: string,
    @Param("paymentId") paymentId: string,
    @Body() dto: PaymentReasonDto,
  ) {
    return this.paymentsService.fail(
      tenantId,
      paymentId,
      dto.reason,
    );
  }

  // ==========================================
  // RECORD FULL REFUND
  // POST /api/v1/payments/:paymentId/refund
  // ==========================================

  @Post("payments/:paymentId/refund")
  @Roles("OWNER", "ADMIN", "ACCOUNTANT")
  refund(
    @CurrentTenant() tenantId: string,
    @Param("paymentId") paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(tenantId, paymentId, {
      reason: dto.reason,
      amount: dto.amount,
      idempotencyKey: dto.idempotencyKey,
    });
  }
}