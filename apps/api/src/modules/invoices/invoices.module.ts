import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { InvoicesController } from "./invoices.controller.js";
import { InvoicesService } from "./invoices.service.js";

@Module({
  imports: [AuthModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, TenantGuard, RolesGuard],
  exports: [InvoicesService],
})
export class InvoicesModule {}