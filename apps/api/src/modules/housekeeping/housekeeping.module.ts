import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { HousekeepingController } from "./housekeeping.controller.js";
import { HousekeepingService } from "./housekeeping.service.js";

@Module({
  imports: [AuthModule],
  controllers: [HousekeepingController],
  providers: [HousekeepingService, TenantGuard, RolesGuard],
  exports: [HousekeepingService],
})
export class HousekeepingModule {}