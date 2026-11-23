



import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";


  
  
  import {
    PaymentMethod,
    PaymentStatus,
    RefundStatus,
    ReservationStatus,
  } from "../../generated/prisma/enums.js";
  import {
    PAYMENT_PROVIDERS,
    PaymentProvider,
    PaymentProviderName,
  } from "./providers/payment-provider.interface.js";
  import {
    amountToCents,
    centsToAmount,
    committedCentsForPayment,
    groupRefundsByPaymentId,
    netPaidCents,
    sumCompletedRefundsCents,
  } from "./payments-balance.util.js";

  export interface RefundPaymentInput {
    reason?: string;
    amount?: number;
    idempotencyKey?: string;
  }

  import { Inject } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  // ============================================
  // PAYMENT INPUT
  // ============================================
  
  export interface CreatePaymentInput {
    amount: number;
    currency?: string;
    method: PaymentMethod;
    provider?: string;
    notes?: string;
  }
  
  // ============================================
  // PAYMENT SERVICE
  // ============================================
  
  @Injectable()
  export class PaymentsService {
    constructor(
      private readonly prisma: PrismaService,
      @Inject(PAYMENT_PROVIDERS)
      private readonly paymentProviders: PaymentProvider[],
    ) {}
  




    async handleStripeWebhook(
      rawBody: string,
      signature: string,
    ) {
      if (!rawBody || !signature) {
        throw new BadRequestException(
          "Stripe webhook body or signature is missing.",
        );
      }
    
      let event: Record<string, any>;
    
      try {
        event = JSON.parse(rawBody);
      } catch {
        throw new BadRequestException(
          "Invalid Stripe webhook JSON.",
        );
      }
    
      const eventObject = event.data?.object;
    
      if (!eventObject || typeof eventObject !== "object") {
        throw new BadRequestException(
          "Stripe webhook event data is missing.",
        );
      }

      const supportedEvents = [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
      ];

      if (!supportedEvents.includes(String(event.type ?? ""))) {
        return {
          received: true,
          ignored: true,
          reason: "Unsupported Stripe event type.",
        };
      }

      if (eventObject.object !== "checkout.session") {
        throw new BadRequestException(
          "Unexpected Stripe webhook object type.",
        );
      }

      if (
        eventObject.mode !== "payment" ||
        !eventObject.metadata?.payment_id
      ) {
        throw new BadRequestException(
          "Invalid Stripe Checkout Session metadata.",
        );
      }
    
      const paymentId = String(
        eventObject.metadata?.payment_id ?? "",
      );
    
      const checkoutSessionId = String(eventObject.id ?? "");
    
      if (!paymentId || !checkoutSessionId) {
        throw new BadRequestException(
          "Stripe payment metadata or Checkout Session ID is missing.",
        );
      }
    
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
          provider: "STRIPE",
          method: PaymentMethod.ONLINE,
        },
      });
    
      if (!payment) {
        throw new NotFoundException(
          "Stripe payment record was not found.",
        );
      }
    
      const provider = this.paymentProviders.find(
        (item) => item.name === "STRIPE",
      );
    
      if (!provider) {
        throw new BadRequestException(
          "Stripe provider is not configured.",
        );
      }
    
      const verification = await provider.verifyPayment({
        paymentId: payment.id,
        providerReference: checkoutSessionId,
        signature,
        rawBody,
        rawPayload: event,
      });
    
      if (!verification.valid) {
        throw new BadRequestException(
          "Stripe webhook signature or payment verification failed.",
        );
      }
    
      if (
        verification.status !== "COMPLETED" &&
        verification.status !== "PROCESSING" &&
        verification.status !== "FAILED"
      ) {
        throw new BadRequestException(
          "Unsupported Stripe payment status.",
        );
      }
    
      if (
        verification.amount === undefined ||
        verification.currency === undefined
      ) {
        throw new BadRequestException(
          "Stripe verification did not return the payment amount and currency.",
        );
      }

      const expectedAmount = Math.round(
        Number(payment.amount) * 100,
      );

      const verifiedAmount = Math.round(
        verification.amount * 100,
      );

      if (verifiedAmount !== expectedAmount) {
        throw new BadRequestException(
          "Stripe payment amount does not match the payment record.",
        );
      }

      if (
        verification.currency.toUpperCase() !==
        payment.currency.toUpperCase()
      ) {
        throw new BadRequestException(
          "Stripe payment currency does not match the payment record.",
        );
      }

      if (
        payment.status === PaymentStatus.COMPLETED ||
        payment.status === PaymentStatus.REFUNDED ||
        payment.status === PaymentStatus.PARTIALLY_REFUNDED
      ) {
        return {
          received: true,
          alreadyProcessed: true,
          paymentId: payment.id,
        };
      }
    
      if (
        payment.status !== PaymentStatus.PENDING &&
        payment.status !== PaymentStatus.PROCESSING
      ) {
        return {
          received: true,
          alreadyProcessed: true,
          paymentId: payment.id,
        };
      }
    
      const newStatus =
        verification.status === "COMPLETED"
          ? PaymentStatus.COMPLETED
          : verification.status === "PROCESSING"
            ? PaymentStatus.PROCESSING
            : PaymentStatus.FAILED;

      if (
        payment.transactionId &&
        payment.transactionId !== checkoutSessionId
      ) {
        throw new BadRequestException(
          "Stripe Checkout Session does not match the stored payment session.",
        );
      }

      const updatedPayment = await this.prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: newStatus,
          transactionId:
            verification.transactionId ??
            String(eventObject.payment_intent ?? checkoutSessionId),
          ...(newStatus === PaymentStatus.COMPLETED
            ? { paidAt: new Date() }
            : {}),
          notes:
            newStatus === PaymentStatus.COMPLETED
              ? "Stripe payment successfully verified."
              : `Stripe webhook received with status ${verification.status}.`,
        },
      });

      return {
        received: true,
        alreadyProcessed: false,
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
      };
    }
    












async handlePayHereNotification(
  payload: Record<string, unknown>,
) {
  const paymentId = String(payload.order_id ?? "");
  const providerReference = String(payload.payment_id ?? "");
  const amount = Number(payload.payhere_amount);
  const currency = String(payload.payhere_currency ?? "").toUpperCase();

  if (!paymentId || !providerReference || !Number.isFinite(amount)) {
    throw new BadRequestException(
      "Invalid PayHere notification payload.",
    );
  }

  

  const payment = await this.prisma.payment.findFirst({
    where: {
      id: paymentId,
      provider: "PAYHERE",
      method: PaymentMethod.ONLINE,
    },
  });

  if (!payment) {
    throw new NotFoundException(
      "PayHere payment record was not found.",
    );
  }

  const provider = this.paymentProviders.find(
    (item) => item.name === "PAYHERE",
  );

  if (!provider) {
    throw new BadRequestException(
      "PayHere provider is not configured.",
    );
  }

  const verification = await provider.verifyPayment({
    paymentId: payment.id,
    providerReference,
    amount,
    currency,
    signature: String(payload.md5sig ?? ""),
    rawPayload: payload,
  });


  if (
    verification.amount === undefined ||
    verification.currency === undefined
  ) {
    throw new BadRequestException(
      "PayHere verification did not return the payment amount and currency.",
    );
  }
  
  if (
    verification.status !== "COMPLETED" &&
    verification.status !== "PROCESSING" &&
    verification.status !== "FAILED"
  ) {
    throw new BadRequestException(
      "Unsupported PayHere payment status.",
    );
  }
  

  const expectedAmount = Math.round(Number(payment.amount) * 100);
  const receivedAmount = Math.round(amount * 100);

  if (
    expectedAmount !== receivedAmount ||
    payment.currency.toUpperCase() !== currency
  ) {
    throw new BadRequestException(
      "PayHere notification amount or currency does not match the payment.",
    );
  }

  if (
    verification.amount !== undefined &&
    Math.round(verification.amount * 100) !== expectedAmount
  ) {
    throw new BadRequestException(
      "Verified PayHere amount does not match the payment.",
    );
  }

  if (
    verification.currency &&
    verification.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    throw new BadRequestException(
      "Verified PayHere currency does not match the payment.",
    );
  }

  // Repeated successful notifications must not create duplicate updates.
  if (payment.status === PaymentStatus.COMPLETED) {
    return {
      received: true,
      alreadyProcessed: true,
      paymentId: payment.id,
    };
  }

  if (
    payment.status === PaymentStatus.REFUNDED ||
    payment.status === PaymentStatus.PARTIALLY_REFUNDED
  ) {
    return {
      received: true,
      alreadyProcessed: true,
      paymentId: payment.id,
    };
  }

  if (
    payment.status !== PaymentStatus.PENDING &&
    payment.status !== PaymentStatus.PROCESSING
  ) {
    return {
      received: true,
      alreadyProcessed: true,
      paymentId: payment.id,
    };
  }

  const status =
    verification.status === "COMPLETED"
      ? PaymentStatus.COMPLETED
      : verification.status === "PROCESSING"
        ? PaymentStatus.PROCESSING
        : PaymentStatus.FAILED;

  const updatedPayment = await this.prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status,
      transactionId: verification.transactionId ?? providerReference,
      ...(status === PaymentStatus.COMPLETED
        ? { paidAt: new Date() }
        : {}),
      notes:
        status === PaymentStatus.COMPLETED
          ? "PayHere payment successfully verified."
          : `PayHere notification received with status ${verification.status}.`,
    },
  });

  return {
    received: true,
    alreadyProcessed: false,
    paymentId: updatedPayment.id,
    status: updatedPayment.status,
  };
}


async createOnlineCheckout(
  tenantId: string,
  reservationId: string,
  providerName: PaymentProviderName,
  input: {
    returnUrl: string;
    cancelUrl: string;
    notifyUrl: string;
    customerCity: string;
  },
) {
  const provider = this.paymentProviders.find(
    (item) => item.name === providerName,
  );

  if (!provider) {
    throw new BadRequestException(
      `Payment provider ${providerName} is not available.`,
    );
  }

  const reservation = await this.prisma.reservation.findFirst({
    where: {
      id: reservationId,
      tenantId,
    },
    include: {
      guest: true,
    },
  });

  if (!reservation) {
    throw new NotFoundException("Reservation not found.");
  }

  if (
    reservation.status === ReservationStatus.CANCELLED ||
    reservation.status === ReservationStatus.NO_SHOW ||
    reservation.status === ReservationStatus.CHECKED_OUT
  ) {
    throw new BadRequestException(
      "Online payment is not available for this reservation.",
    );
  }

  const guest = reservation.guest;

  if (!guest.email) {
    throw new BadRequestException(
      "The guest must have an email address before online checkout.",
    );
  }

  if (!input.customerCity?.trim()) {
    throw new BadRequestException("Customer city is required.");
  }

  if (!guest.address || !guest.country) {
    throw new BadRequestException(
      "The guest must have an address and country before online checkout.",
    );
  }

  const payment = await this.prisma.$transaction(
    async (tx) => {
      const existingPayments = await tx.payment.findMany({
        where: {
          tenantId,
          reservationId,
        },
        select: {
          id: true,
          amount: true,
          status: true,
        },
      });

      const paymentIds = existingPayments.map((item) => item.id);

      const existingRefunds =
        paymentIds.length > 0
          ? await tx.paymentRefund.findMany({
              where: {
                tenantId,
                paymentId: { in: paymentIds },
              },
              select: {
                paymentId: true,
                status: true,
                amount: true,
              },
            })
          : [];

      const refundsByPaymentId =
        groupRefundsByPaymentId(existingRefunds);

      const reservationAmount = amountToCents(reservation.totalAmount);

      const committedAmount = existingPayments.reduce(
        (total, item) =>
          total +
          committedCentsForPayment(
            item,
            refundsByPaymentId.get(item.id) ?? [],
          ),
        0,
      );

      const remainingAmount =
        reservationAmount - committedAmount;

      if (remainingAmount <= 0) {
        throw new BadRequestException(
          "There is no outstanding balance for this reservation.",
        );
      }

      return tx.payment.create({
        data: {
          tenantId,
          reservationId,
          amount: (remainingAmount / 100).toFixed(2),
          currency: reservation.currency,
          method: PaymentMethod.ONLINE,
          provider: providerName,
          status: PaymentStatus.PENDING,
          notes: `Online checkout created using ${providerName}.`,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    },
  );

  try {
    const checkout = await provider.createCheckout({
      paymentId: payment.id,
      reservationId,
      amount: Number(payment.amount),
      currency: payment.currency,
      customer: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone ?? "",
        address: guest.address,
        city: input.customerCity.trim(),
        country: guest.country,
      },
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      notifyUrl: input.notifyUrl,
    });

    const updatedPayment = await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        transactionId: checkout.providerReference ?? null,
      },
    });

    return {
      payment: updatedPayment,
      provider: providerName,
      checkoutUrl: checkout.checkoutUrl,
      formFields: checkout.formFields ?? null,
    };
  } catch (error) {
    await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        notes: `Checkout creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
    });

    throw new BadRequestException(
      "Could not create the online payment checkout.",
    );
  }
}



    
    // ==========================================
    // CREATE PAYMENT
    // ==========================================
  
    async create(
      tenantId: string,
      reservationId: string,
      input: CreatePaymentInput,
    ) {
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        throw new BadRequestException(
          "Payment amount must be greater than zero.",
        );
      }
  
      const amountInCents = Math.round(input.amount * 100);
  
      if (
        Math.abs(input.amount * 100 - amountInCents) > 0.000001
      ) {
        throw new BadRequestException(
          "Payment amount cannot have more than two decimal places.",
        );
      }
  
      return this.prisma.$transaction(
        async (tx) => {
          const reservation = await tx.reservation.findFirst({
            where: {
              id: reservationId,
              tenantId,
            },
            include: {
              payments: {
                select: {
                  id: true,
                  amount: true,
                  status: true,
                },
              },
            },
          });
  
          if (!reservation) {
            throw new NotFoundException("Reservation not found.");
          }
  
          if (
            reservation.status === ReservationStatus.CANCELLED ||
            reservation.status === ReservationStatus.NO_SHOW
          ) {
            throw new BadRequestException(
              "Payments cannot be added to a cancelled or no-show reservation.",
            );
          }
  
          const currency = (
            input.currency ?? reservation.currency
          ).toUpperCase();
  
          if (currency !== reservation.currency) {
            throw new BadRequestException(
              "Payment currency must match the reservation currency.",
            );
          }
  
          const paymentIds = reservation.payments.map(
            (payment) => payment.id,
          );

          const refunds =
            paymentIds.length > 0
              ? await tx.paymentRefund.findMany({
                  where: {
                    tenantId,
                    paymentId: { in: paymentIds },
                  },
                  select: {
                    paymentId: true,
                    status: true,
                    amount: true,
                  },
                })
              : [];

          const refundsByPaymentId = groupRefundsByPaymentId(refunds);

          const netPaid = netPaidCents(
            reservation.payments,
            refundsByPaymentId,
          );

          const reservationTotal = amountToCents(
            reservation.totalAmount,
          );
  
          if (netPaid + amountInCents > reservationTotal) {
            throw new BadRequestException(
              "Payment amount exceeds the remaining reservation balance.",
            );
          }
  
          return tx.payment.create({
            data: {
              tenantId,
              reservationId,
              amount: (amountInCents / 100).toFixed(2),
              currency,
              method: input.method,
              status: PaymentStatus.PENDING,
              provider: input.provider,
              notes: input.notes,
            },
            include: {
              reservation: true,
            },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );
    }
  
    // ==========================================
    // FIND PAYMENTS FOR RESERVATION
    // ==========================================
  
    async findByReservation(
      tenantId: string,
      reservationId: string,
    ) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          id: reservationId,
          tenantId,
        },
        select: {
          id: true,
          confirmationCode: true,
          totalAmount: true,
          currency: true,
        },
      });
  
      if (!reservation) {
        throw new NotFoundException("Reservation not found.");
      }
  
      const payments = await this.prisma.payment.findMany({
        where: {
          tenantId,
          reservationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          refunds: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
  
      const refunds = payments.flatMap((payment) =>
        payment.refunds.map((refund) => ({
          paymentId: payment.id,
          status: refund.status,
          amount: refund.amount,
        })),
      );

      const refundsByPaymentId = groupRefundsByPaymentId(refunds);
      const netPaidCentsValue = netPaidCents(payments, refundsByPaymentId);
      const refundedCents = refunds
        .filter((refund) => refund.status === RefundStatus.COMPLETED)
        .reduce(
          (total, refund) => total + amountToCents(refund.amount),
          0,
        );

      const totalAmount = Number(reservation.totalAmount);
      const paidAmount = centsToAmount(netPaidCentsValue);
      const refundedAmount = centsToAmount(refundedCents);
  
      return {
        reservation,
        payments,
        summary: {
          totalAmount,
          paidAmount,
          refundedAmount,
          balance: Math.max(
            0,
            centsToAmount(
              Math.max(
                0,
                amountToCents(totalAmount) - netPaidCentsValue,
              ),
            ),
          ),
          currency: reservation.currency,
        },
      };
    }
  
    // ==========================================
    // FIND ONE PAYMENT
    // ==========================================
  
    async findOne(
      tenantId: string,
      paymentId: string,
    ) {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
          tenantId,
        },
        include: {
          reservation: {
            include: {
              guest: true,
              branch: true,
            },
          },
          refunds: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
  
      if (!payment) {
        throw new NotFoundException("Payment not found.");
      }
  
      return payment;
    }
  
    // ==========================================
    // COMPLETE PAYMENT
    // ==========================================
  
    async complete(
      tenantId: string,
      paymentId: string,
      transactionId?: string,
    ) {
      return this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: {
            id: paymentId,
            tenantId,
          },
        });
  
        if (!payment) {
          throw new NotFoundException("Payment not found.");
        }
  
        if (
          payment.status !== PaymentStatus.PENDING &&
          payment.status !== PaymentStatus.PROCESSING
        ) {
          throw new BadRequestException(
            "Only pending or processing payments can be completed.",
          );
        }
  
        if (transactionId) {
          const existingTransaction = await tx.payment.findFirst({
            where: {
              tenantId,
              transactionId,
              NOT: {
                id: paymentId,
              },
            },
          });
  
          if (existingTransaction) {
            throw new ConflictException(
              "This transaction ID is already associated with another payment.",
            );
          }
        }
  
        return tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId,
            paidAt: new Date(),
          },
          include: {
            reservation: true,
          },
        });
      });
    }
  
    // ==========================================
    // MARK PAYMENT AS PROCESSING
    // ==========================================
  
    async markProcessing(
      tenantId: string,
      paymentId: string,
    ) {
      const payment = await this.findOne(tenantId, paymentId);
  
      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestException(
          "Only pending payments can be marked as processing.",
        );
      }
  
      return this.prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.PROCESSING,
        },
      });
    }
  
    // ==========================================
    // FAIL PAYMENT
    // ==========================================
  
    async fail(
      tenantId: string,
      paymentId: string,
      reason?: string,
    ) {
      const payment = await this.findOne(tenantId, paymentId);
  
      if (
        payment.status !== PaymentStatus.PENDING &&
        payment.status !== PaymentStatus.PROCESSING
      ) {
        throw new BadRequestException(
          "Only pending or processing payments can be marked as failed.",
        );
      }
  
      const notes = [
        payment.notes,
        reason ? `Payment failure: ${reason}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
  
      return this.prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.FAILED,
          notes: notes || null,
        },
      });
    }
  
    // ==========================================
    // RECORD FULL REFUND
    // ==========================================
  
    async refund(
      tenantId: string,
      paymentId: string,
      input: RefundPaymentInput = {},
    ) {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
          tenantId,
        },
        include: {
          refunds: true,
          reservation: true,
        },
      });

      if (!payment) {
        throw new NotFoundException("Payment not found.");
      }

      if (
        payment.status !== PaymentStatus.COMPLETED &&
        payment.status !== PaymentStatus.PARTIALLY_REFUNDED
      ) {
        throw new BadRequestException(
          "Only completed or partially refunded payments can be refunded.",
        );
      }

      if (input.idempotencyKey) {
        const existing = payment.refunds.find(
          (refund) =>
            refund.idempotencyKey === input.idempotencyKey &&
            refund.status === RefundStatus.COMPLETED,
        );

        if (existing) {
          return {
            payment: await this.findOne(tenantId, paymentId),
            refund: existing,
            alreadyProcessed: true,
          };
        }
      }

      const alreadyRefundedCents = sumCompletedRefundsCents(
        payment.refunds,
      );
      const paymentAmountCents = amountToCents(payment.amount);
      const remainingRefundableCents =
        paymentAmountCents - alreadyRefundedCents;

      if (remainingRefundableCents <= 0) {
        throw new BadRequestException(
          "This payment has no remaining refundable balance.",
        );
      }

      let refundCents = remainingRefundableCents;

      if (input.amount !== undefined) {
        if (!Number.isFinite(input.amount) || input.amount <= 0) {
          throw new BadRequestException(
            "Refund amount must be greater than zero.",
          );
        }

        refundCents = amountToCents(input.amount);

        if (
          Math.abs(input.amount * 100 - refundCents) > 0.000001
        ) {
          throw new BadRequestException(
            "Refund amount cannot have more than two decimal places.",
          );
        }
      }

      if (refundCents > remainingRefundableCents) {
        throw new BadRequestException(
          "Refund amount exceeds the remaining refundable balance.",
        );
      }

      const refundAmount = centsToAmount(refundCents);
      const reasonText =
        input.reason ?? `Refund of ${refundAmount.toFixed(2)} ${payment.currency}.`;

      const isOnlineProvider =
        payment.method === PaymentMethod.ONLINE &&
        payment.provider &&
        payment.transactionId;

      let providerRefundId: string | undefined;

      if (isOnlineProvider) {
        const providerName = payment.provider as PaymentProviderName;
        const provider = this.paymentProviders.find(
          (item) => item.name === providerName,
        );

        if (!provider) {
          throw new BadRequestException(
            `${providerName} provider is not configured.`,
          );
        }

        const providerResult = await provider.refundPayment({
          paymentId: payment.id,
          transactionId: payment.transactionId!,
          amount: refundAmount,
          currency: payment.currency,
          reason: reasonText,
        });

        if (!providerResult.successful) {
          throw new BadRequestException(
            providerResult.message ??
              "The payment provider rejected the refund request.",
          );
        }

        providerRefundId = providerResult.providerReference;
      }

      const totalRefundedAfter = alreadyRefundedCents + refundCents;
      const newPaymentStatus =
        totalRefundedAfter >= paymentAmountCents
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      const notes = [payment.notes, reasonText]
        .filter(Boolean)
        .join("\n");

      const result = await this.prisma.$transaction(async (tx) => {
        const refundRecord = await tx.paymentRefund.create({
          data: {
            tenantId,
            paymentId,
            amount: refundAmount.toFixed(2),
            currency: payment.currency,
            status: RefundStatus.COMPLETED,
            provider: payment.provider,
            providerRefundId,
            reason: reasonText,
            idempotencyKey: input.idempotencyKey,
          },
        });

        const updatedPayment = await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: newPaymentStatus,
            notes: notes || null,
          },
          include: {
            reservation: true,
            refunds: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        return {
          payment: updatedPayment,
          refund: refundRecord,
          alreadyProcessed: false,
        };
      });

      return result;
    }

    async getReconciliation(
      tenantId: string,
      options: {
        provider?: string;
        limit?: number;
      } = {},
    ) {
      const safeLimit = Math.min(
        100,
        Math.max(1, Math.floor(options.limit ?? 50)),
      );

      const payments = await this.prisma.payment.findMany({
        where: {
          tenantId,
          ...(options.provider
            ? { provider: options.provider.toUpperCase() }
            : {}),
        },
        take: safeLimit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          refunds: {
            orderBy: {
              createdAt: "desc",
            },
          },
          reservation: {
            select: {
              id: true,
              confirmationCode: true,
              status: true,
            },
          },
        },
      });

      return payments.map((payment) => {
        const refundableRemainingCents = Math.max(
          0,
          amountToCents(payment.amount) -
            sumCompletedRefundsCents(payment.refunds),
        );

        return {
          id: payment.id,
          reservationId: payment.reservationId,
          confirmationCode: payment.reservation.confirmationCode,
          amount: Number(payment.amount),
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          provider: payment.provider,
          transactionId: payment.transactionId,
          paidAt: payment.paidAt,
          refundableRemaining: centsToAmount(refundableRemainingCents),
          refunds: payment.refunds.map((refund) => ({
            id: refund.id,
            amount: Number(refund.amount),
            status: refund.status,
            providerRefundId: refund.providerRefundId,
            createdAt: refund.createdAt,
          })),
          createdAt: payment.createdAt,
        };
      });
    }
  }
  