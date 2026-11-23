import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { InvoicesService } from "./invoices.service.js";

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post("reservations/:reservationId/invoices")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "ACCOUNTANT")
  createFromReservation(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
  ) {
    return this.invoicesService.createDraftFromReservation(
      tenantId,
      reservationId,
    );
  }

  @Get("reservations/:reservationId/invoices")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
    "ACCOUNTANT",
  )
  findByReservation(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
  ) {
    return this.invoicesService.findByReservation(
      tenantId,
      reservationId,
    );
  }

  @Get("invoices/:invoiceId")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
    "ACCOUNTANT",
  )
  findOne(
    @CurrentTenant() tenantId: string,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.invoicesService.findOne(tenantId, invoiceId);
  }

  @Post("invoices/:invoiceId/issue")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "ACCOUNTANT")
  issue(
    @CurrentTenant() tenantId: string,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.invoicesService.issue(tenantId, invoiceId);
  }

  @Post("invoices/:invoiceId/sync-payment-status")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "ACCOUNTANT")
  syncPaymentStatus(
    @CurrentTenant() tenantId: string,
    @Param("invoiceId") invoiceId: string,
  ) {
    return this.invoicesService.syncPaymentStatus(tenantId, invoiceId);
  }
}