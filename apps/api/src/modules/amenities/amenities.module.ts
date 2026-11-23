import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { AmenitiesController } from "./amenities.controller.js";
import { AmenitiesService } from "./amenities.service.js";

@Module({
  imports: [AuthModule],
  controllers: [AmenitiesController],
  providers: [AmenitiesService, TenantGuard, RolesGuard],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}