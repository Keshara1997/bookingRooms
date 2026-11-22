
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
      @CurrentTenant() tenant: { id: string },
      @Param("branchId") branchId: string,
      @Body() dto: CreateReservationDto,
    ) {
      return this.reservationsService.create(
        tenant.id,
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
      @CurrentTenant() tenant: { id: string },
      @Param("branchId") branchId: string,
      @Query() filters: SearchReservationsDto,
    ) {
      return this.reservationsService.findAll(
        tenant.id,
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
      @CurrentTenant() tenant: { id: string },
      @Param("reservationId") reservationId: string,
    ) {
      return this.reservationsService.findOne(
        tenant.id,
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
      @CurrentTenant() tenant: { id: string },
      @Param("reservationId") reservationId: string,
      @Body() dto: UpdateReservationDto,
    ) {
      return this.reservationsService.update(
        tenant.id,
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
      @CurrentTenant() tenant: { id: string },
      @Param("reservationId") reservationId: string,
    ) {
      return this.reservationsService.confirm(
        tenant.id,
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
    @CurrentTenant() tenant: { id: string },
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationsService.checkIn(
      tenant.id,
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
    @CurrentTenant() tenant: { id: string },
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationsService.checkOut(
      tenant.id,
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
    @CurrentTenant() tenant: { id: string },
    @Param("reservationId") reservationId: string,
  ) {
    return this.reservationsService.markNoShow(
      tenant.id,
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
      @CurrentTenant() tenant: { id: string },
      @Param("reservationId") reservationId: string,
    ) {
      return this.reservationsService.cancel(
        tenant.id,
        reservationId,
      );
    }
  }
  