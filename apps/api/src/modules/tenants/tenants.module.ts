import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TenantsController } from "./tenants.controller.js";

import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [
    TenantGuard,
    RolesGuard,
  ],
})
export class TenantsModule {}