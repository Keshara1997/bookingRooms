import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { RoomTypesController } from "./room-types.controller";
import { RoomTypesService } from "./room-types.service";

@Module({
  imports: [AuthModule],
  controllers: [RoomTypesController],
  providers: [RoomTypesService, TenantGuard, RolesGuard],
  exports: [RoomTypesService],
})
export class RoomTypesModule {}