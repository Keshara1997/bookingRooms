
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../database/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";

import { PricingController } from "./pricing.controller.js";
import { PricingService } from "./pricing.service.js";
import { DailyRatesService } from "./daily-rates.service.js";
import { PricingCalculatorService } from "./pricing-calculator.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PricingController],
  providers: [
    PricingService,
    DailyRatesService,
    PricingCalculatorService,
    TenantGuard,
    RolesGuard,
  ],
  exports: [
    PricingService,
    DailyRatesService,
    PricingCalculatorService,
  ],
})
export class PricingModule {}
