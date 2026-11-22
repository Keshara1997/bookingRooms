
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../database/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { PricingModule } from "../pricing/pricing.module.js";

import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";

import { ReservationsController } from "./reservations.controller.js";
import { ReservationsService } from "./reservations.service.js";
import { ReservationNumberService } from "./reservation-number.service.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PricingModule,
  ],

  controllers: [
    ReservationsController,
  ],

  providers: [
    ReservationsService,
    ReservationNumberService,
    TenantGuard,
    RolesGuard,
  ],

  exports: [
    ReservationsService,
  ],
})
export class ReservationsModule {}
