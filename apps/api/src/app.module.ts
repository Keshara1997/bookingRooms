
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "./database/prisma.module.js";

import { AuthModule } from "./modules/auth/auth.module.js";
import { TenantsModule } from "./modules/tenants/tenants.module.js";
import { HotelsModule } from "./modules/hotels/hotels.module.js";
import { BranchesModule } from "./modules/branches/branches.module.js";
import { RoomTypesModule } from "./modules/room-types/room-types.module";
import { RoomsModule } from "./modules/rooms/rooms.module.js";
import { PricingModule } from "./modules/pricing/pricing.module.js";
import { InventoryModule } from "./modules/inventory/inventory.module.js";
import { ReservationsModule } from "./modules/reservations/reservations.module.js";
import { GuestsModule } from "./modules/guests/guests.module.js";


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    PrismaModule,

    AuthModule,
    TenantsModule,
    HotelsModule,
    BranchesModule,
    RoomTypesModule,
    RoomsModule,
    PricingModule,
    InventoryModule,
    ReservationsModule,
    GuestsModule,
  ],
})
export class AppModule {}
