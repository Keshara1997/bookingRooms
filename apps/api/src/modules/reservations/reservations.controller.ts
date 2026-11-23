
import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
  } from "@nestjs/common";
  
  import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
  import { Roles } from "../../common/decorators/roles.decorator.js";
  
  import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
  import { TenantGuard } from "../../common/guards/tenant.guard.js";
  import { RolesGuard } from "../../common/guards/roles.guard.js";
  
  import { CreateReservationDto } from "./dto/create-reservation.dto.js";
  import { UpdateReservationDto } from "./dto/update-reservation.dto.js";
  import { SearchReservationsDto } from "./dto/search-reservations.dto.js";
  
  import { ReservationsService } from "./reservations.service.js";
  
  // ============================================
  // RESERVATIONS CONTROLLER
  // ============================================
  
  @Controller()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class ReservationsController {
    constructor(
      private readonly reservationsService: ReservationsService,
    ) {}
  
    // ==========================================
    // CREATE RESERVATION
    // POST /api/v1/branches/:branchId/reservations
    // ==========================================
  
    @Post("branches/:branchId/reservations")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
    create(
      @CurrentTenant() tenantId: string,
      @Param("branchId") branchId: string,
      @Body() dto: CreateReservationDto,
    ) {
      return this.reservationsService.create(
        tenantId,
        branchId,
        dto,
      );
    }
  
    // ==========================================
    // SEARCH RESERVATIONS
    // GET /api/v1/branches/:branchId/reservations
    // ==========================================
  
    @Get("branches/:branchId/reservations")
    @Roles(
      "OWNER",
      "ADMIN",
      "HOTEL_MANAGER",
      "RECEPTIONIST",
      "ACCOUNTANT",
    )
    findAll(
      @CurrentTenant() tenantId: string,
      @Param("branchId") branchId: string,
      @Query() filters: SearchReservationsDto,
    ) {
      return this.reservationsService.findAll(
        tenantId,
        branchId,
        filters,
      );
    }
  
    // ==========================================
    // GET RESERVATION DETAILS
    // GET /api/v1/reservations/:reservationId
    // ==========================================
  
    @Get("reservations/:reservationId")
    @Roles(
      "OWNER",
      "ADMIN",
      "HOTEL_MANAGER",
      "RECEPTIONIST",
      "ACCOUNTANT",
    )
    findOne(
      @CurrentTenant() tenantId: string,
      @Param("reservationId") reservationId: string,
    ) {
      return this.reservationsService.findOne(
        tenantId,
        reservationId,
      );
    }
  
    // ==========================================
    // UPDATE RESERVATION
    // PATCH /api/v1/reservations/:reservationId
    // ==========================================
  
    @Patch("reservations/:reservationId")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
    update(
      @CurrentTenant() tenantId: string,
      @Param("reservationId") reservationId: string,
      @Body() dto: UpdateReservationDto,
    ) {
      return this.reservationsService.update(
        tenantId,
        reservationId,
        dto,
      );
    }
  
    // ==========================================
    // CONFIRM RESERVATION
    // POST /api/v1/reservations/:reservationId/confirm
    // ==========================================
  
    @Post("reservations/:reservationId/confirm")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
    confirm(
      @CurrentTenant() tenantId: string,
      @Param("reservationId") reservationId: string,
    ) {
      return this.reservationsService.confirm(
        tenantId,
        reservationId,
      );
    }


  // ==========================================
  // CHECK IN
  // POST /api/v1/reservations/:reservationId/check-in
  // ==========================================

  @Post("reservations/:reservationId/check-in")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
  checkIn(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationsService.checkIn(
      tenantId,
      reservationId,
    );
  }

  // ==========================================
  // CHECK OUT
  // POST /api/v1/reservations/:reservationId/check-out
  // ==========================================

  @Post("reservations/:reservationId/check-out")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
  checkOut(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationsService.checkOut(
      tenantId,
      reservationId,
    );
  }

  // ==========================================
  // MARK NO-SHOW
  // POST /api/v1/reservations/:reservationId/no-show
  // ==========================================

  @Post("reservations/:reservationId/no-show")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
  markNoShow(
    @CurrentTenant() tenantId: string,
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationsService.markNoShow(
      tenantId,
      reservationId,
    );
  }

  
    // ==========================================
    // CANCEL RESERVATION
    // POST /api/v1/reservations/:reservationId/cancel
    // ==========================================
  
    @Post("reservations/:reservationId/cancel")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
    cancel(
      @CurrentTenant() tenantId: string,
      @Param("reservationId") reservationId: string,
    ) {
      return this.reservationsService.cancel(
        tenantId,
        reservationId,
      );
    }
  }
  