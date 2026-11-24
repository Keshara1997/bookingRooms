import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";

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

  @Get("invoices/:invoiceId/pdf")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "RECEPTIONIST",
    "ACCOUNTANT",
  )
  async downloadPdf(
    @CurrentTenant() tenantId: string,
    @Param("invoiceId") invoiceId: string,
    @Res() response: Response,
  ) {
    const { buffer, filename } = await this.invoicesService.buildPdfBuffer(
      tenantId,
      invoiceId,
    );

    response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length,
    });
    response.send(buffer);
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