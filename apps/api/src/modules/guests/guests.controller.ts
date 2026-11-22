
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
  
  import {
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  
  import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
  import { Roles } from "../../common/decorators/roles.decorator.js";
  
  import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
  import { TenantGuard } from "../../common/guards/tenant.guard.js";
  import { RolesGuard } from "../../common/guards/roles.guard.js";
  
  import {
    CreateGuestInput,
    GuestsService,
    UpdateGuestInput,
  } from "./guests.service.js";
  
  // ============================================
  // CREATE GUEST DTO
  // ============================================
  
  class CreateGuestDto implements CreateGuestInput {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;
  
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;
  
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    address?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
  }
  
  // ============================================
  // UPDATE GUEST DTO
  // ============================================
  
  class UpdateGuestDto implements UpdateGuestInput {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;
  
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    address?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
  }
  
  // ============================================
  // GUEST SEARCH DTO
  // ============================================
  
  class SearchGuestsDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    search?: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 20;
  }
  
  // ============================================
  // GUESTS CONTROLLER
  // ============================================
  
  @Controller("guests")
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class GuestsController {
    constructor(
      private readonly guestsService: GuestsService,
    ) {}
  
    // ==========================================
    // CREATE GUEST
    // POST /api/v1/guests
    // ==========================================
  
    @Post()
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
    create(
      @CurrentTenant() tenant: { id: string },
      @Body() dto: CreateGuestDto,
    ) {
      return this.guestsService.create(
        tenant.id,
        dto,
      );
    }
  
    // ==========================================
    // SEARCH GUESTS
    // GET /api/v1/guests
    // ==========================================
  
    @Get()
    @Roles(
      "OWNER",
      "ADMIN",
      "HOTEL_MANAGER",
      "RECEPTIONIST",
      "ACCOUNTANT",
    )
    findAll(
      @CurrentTenant() tenant: { id: string },
      @Query() filters: SearchGuestsDto,
    ) {
      return this.guestsService.findAll(
        tenant.id,
        filters.search,
        filters.page,
        filters.limit,
      );
    }
  
    // ==========================================
    // GET GUEST DETAILS
    // GET /api/v1/guests/:guestId
    // ==========================================
  
    @Get(":guestId")
    @Roles(
      "OWNER",
      "ADMIN",
      "HOTEL_MANAGER",
      "RECEPTIONIST",
      "ACCOUNTANT",
    )
    findOne(
      @CurrentTenant() tenant: { id: string },
      @Param("guestId") guestId: string,
    ) {
      return this.guestsService.findOne(
        tenant.id,
        guestId,
      );
    }
  
    // ==========================================
    // UPDATE GUEST
    // PATCH /api/v1/guests/:guestId
    // ==========================================
  
    @Patch(":guestId")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "RECEPTIONIST")
    update(
      @CurrentTenant() tenant: { id: string },
      @Param("guestId") guestId: string,
      @Body() dto: UpdateGuestDto,
    ) {
      return this.guestsService.update(
        tenant.id,
        guestId,
        dto,
      );
    }
  
    // ==========================================
    // GUEST RESERVATION HISTORY
    // GET /api/v1/guests/:guestId/reservations
    // ==========================================
  
    @Get(":guestId/reservations")
    @Roles(
      "OWNER",
      "ADMIN",
      "HOTEL_MANAGER",
      "RECEPTIONIST",
      "ACCOUNTANT",
    )
    getReservationHistory(
      @CurrentTenant() tenant: { id: string },
      @Param("guestId") guestId: string,
    ) {
      return this.guestsService.getReservationHistory(
        tenant.id,
        guestId,
      );
    }
  }
  