
import { Module } from "@nestjs/common";

import { PrismaModule } from "../../database/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";

import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";

import { GuestsController } from "./guests.controller.js";
import { GuestsService } from "./guests.service.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],

  controllers: [
    GuestsController,
  ],

  providers: [
    GuestsService,
    TenantGuard,
    RolesGuard,
  ],

  exports: [
    GuestsService,
  ],
})
export class GuestsModule {}
