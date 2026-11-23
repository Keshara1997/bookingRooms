
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../database/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";

import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";

import { PaymentsService } from "./payments.service.js";

import { PayHereProvider } from "./providers/payhere.provider.js";
import { StripeProvider } from "./providers/stripe.provider.js";

import {
  PAYMENT_PROVIDERS,
} from "./providers/payment-provider.interface.js";

import {
    PaymentsController,
    StripeWebhookController,
    PayHereWebhookController,
  } from "./payments.controller.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],

  controllers: [
    PaymentsController,
    StripeWebhookController,
    PayHereWebhookController,
  ],

  providers: [
    PaymentsService,
    PayHereProvider,
    StripeProvider,

    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (
        payhere: PayHereProvider,
        stripe: StripeProvider,
      ) => [
        payhere,
        stripe,
      ],
      inject: [
        PayHereProvider,
        StripeProvider,
      ],
    },

    TenantGuard,
    RolesGuard,
  ],

  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule {}
