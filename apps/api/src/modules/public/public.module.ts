import { Module } from "@nestjs/common";

import { PrismaModule } from "../../database/prisma.module.js";
import { InventoryModule } from "../inventory/inventory.module.js";
import { PricingModule } from "../pricing/pricing.module.js";
import { ReservationsModule } from "../reservations/reservations.module.js";
import { PublicStorefrontController } from "./public-storefront.controller.js";
import { PublicStorefrontService } from "./public-storefront.service.js";

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    PricingModule,
    ReservationsModule,
  ],
  controllers: [PublicStorefrontController],
  providers: [PublicStorefrontService],
})
export class PublicModule {}