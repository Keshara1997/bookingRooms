import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";

import { InventoryController } from "./inventory.controller.js";
import { InventoryService } from "./inventory.service.js";
import { AvailabilityService } from "./availability.service.js";
import { RoomBlocksService } from "./room-blocks.service.js";

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    AvailabilityService,
    RoomBlocksService,
    TenantGuard,
    RolesGuard,
  ],
  exports: [InventoryService, AvailabilityService, RoomBlocksService],
})
export class InventoryModule {}