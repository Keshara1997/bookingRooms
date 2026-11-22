import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";

import { CreateRatePlanDto } from "./dto/create-rate-plan.dto.js";
import { UpdateRatePlanDto } from "./dto/update-rate-plan.dto.js";
import { QueryRatePlansDto } from "./dto/query-rate-plans.dto.js";
import { CreateDailyRateDto } from "./dto/create-daily-rate.dto.js";
import { UpdateDailyRateDto } from "./dto/update-daily-rate.dto.js";
import { QueryDailyRatesDto } from "./dto/query-daily-rates.dto.js";

import { PricingService } from "./pricing.service.js";
import { DailyRatesService } from "./daily-rates.service.js";
import { PricingCalculatorService } from "./pricing-calculator.service.js";

const PRICING_MANAGE_ROLES = ["OWNER", "ADMIN", "HOTEL_MANAGER"] as const;

const PRICING_READ_ROLES = [
  "OWNER",
  "ADMIN",
  "HOTEL_MANAGER",
  "RECEPTIONIST",
  "ACCOUNTANT",
] as const;

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly dailyRatesService: DailyRatesService,
    private readonly pricingCalculatorService: PricingCalculatorService,
  ) {}

  @Post("room-types/:roomTypeId/rate-plans")
  @Roles(...PRICING_MANAGE_ROLES)
  createRatePlan(
    @CurrentTenant() tenantId: string,
    @Param("roomTypeId") roomTypeId: string,
    @Body() dto: CreateRatePlanDto,
  ) {
    return this.pricingService.create(tenantId, roomTypeId, dto);
  }

  @Get("room-types/:roomTypeId/rate-plans")
  @Roles(...PRICING_READ_ROLES)
  findRatePlans(
    @CurrentTenant() tenantId: string,
    @Param("roomTypeId") roomTypeId: string,
    @Query() query: QueryRatePlansDto,
  ) {
    return this.pricingService.findAll(tenantId, roomTypeId, query);
  }

  @Get("rate-plans/:ratePlanId")
  @Roles(...PRICING_READ_ROLES)
  findRatePlan(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
  ) {
    return this.pricingService.findOne(tenantId, ratePlanId);
  }

  @Patch("rate-plans/:ratePlanId")
  @Roles(...PRICING_MANAGE_ROLES)
  updateRatePlan(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Body() dto: UpdateRatePlanDto,
  ) {
    return this.pricingService.update(tenantId, ratePlanId, dto);
  }

  @Delete("rate-plans/:ratePlanId")
  @Roles(...PRICING_MANAGE_ROLES)
  archiveRatePlan(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
  ) {
    return this.pricingService.archive(tenantId, ratePlanId);
  }

  @Post("rate-plans/:ratePlanId/daily-rates")
  @Roles(...PRICING_MANAGE_ROLES)
  createDailyRate(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Body() dto: CreateDailyRateDto,
  ) {
    return this.dailyRatesService.create(tenantId, ratePlanId, dto);
  }

  @Get("rate-plans/:ratePlanId/daily-rates")
  @Roles(...PRICING_READ_ROLES)
  findDailyRates(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Query() query: QueryDailyRatesDto,
  ) {
    return this.dailyRatesService.findAll(tenantId, ratePlanId, query);
  }

  @Get("rate-plans/:ratePlanId/daily-rates/:dailyRateId")
  @Roles(...PRICING_READ_ROLES)
  findDailyRate(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Param("dailyRateId") dailyRateId: string,
  ) {
    return this.dailyRatesService.findOne(
      tenantId,
      ratePlanId,
      dailyRateId,
    );
  }

  @Patch("rate-plans/:ratePlanId/daily-rates/:dailyRateId")
  @Roles(...PRICING_MANAGE_ROLES)
  updateDailyRate(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Param("dailyRateId") dailyRateId: string,
    @Body() dto: UpdateDailyRateDto,
  ) {
    return this.dailyRatesService.update(
      tenantId,
      ratePlanId,
      dailyRateId,
      dto,
    );
  }

  @Delete("rate-plans/:ratePlanId/daily-rates/:dailyRateId")
  @Roles(...PRICING_MANAGE_ROLES)
  deleteDailyRate(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Param("dailyRateId") dailyRateId: string,
  ) {
    return this.dailyRatesService.remove(
      tenantId,
      ratePlanId,
      dailyRateId,
    );
  }

  @Get("rate-plans/:ratePlanId/calculate")
  @Roles(...PRICING_READ_ROLES)
  calculatePrice(
    @CurrentTenant() tenantId: string,
    @Param("ratePlanId") ratePlanId: string,
    @Query("checkIn") checkIn: string,
    @Query("checkOut") checkOut: string,
  ) {
    return this.pricingCalculatorService.calculate({
      tenantId,
      ratePlanId,
      checkIn,
      checkOut,
    });
  }
}