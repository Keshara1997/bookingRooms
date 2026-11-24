import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";

import { CheckAvailabilityDto } from "../inventory/dto/check-availability.dto.js";
import { AvailabilityService } from "../inventory/availability.service.js";
import { PublicCreateBookingDto } from "./dto/public-create-booking.dto.js";
import { PublicStorefrontService } from "./public-storefront.service.js";

@Controller("public")
export class PublicStorefrontController {
  constructor(
    private readonly storefront: PublicStorefrontService,
    private readonly availability: AvailabilityService,
  ) {}

  @Get("tenants/:tenantSlug/hotels")
  listHotels(@Param("tenantSlug") tenantSlug: string) {
    return this.storefront.listHotels(tenantSlug);
  }

  @Get("tenants/:tenantSlug/hotels/:hotelSlug")
  getHotel(
    @Param("tenantSlug") tenantSlug: string,
    @Param("hotelSlug") hotelSlug: string,
  ) {
    return this.storefront.getHotel(tenantSlug, hotelSlug);
  }

  @Get("tenants/:tenantSlug/branches/:branchId/search")
  searchStays(
    @Param("tenantSlug") tenantSlug: string,
    @Param("branchId") branchId: string,
    @Query("checkIn") checkIn: string,
    @Query("checkOut") checkOut: string,
    @Query("adults") adultsRaw?: string,
    @Query("children") childrenRaw?: string,
  ) {
    const adults = Math.max(1, Number(adultsRaw ?? 2));
    const children = Math.max(0, Number(childrenRaw ?? 0));

    return this.storefront.searchStays(
      tenantSlug,
      branchId,
      checkIn,
      checkOut,
      adults,
      children,
    );
  }

  @Post("tenants/:tenantSlug/branches/:branchId/availability")
  async checkAvailability(
    @Param("tenantSlug") tenantSlug: string,
    @Param("branchId") branchId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    const tenant = await this.storefront.resolveTenantBySlug(tenantSlug);

    return this.availability.checkAvailability(
      tenant.id,
      branchId,
      dto,
    );
  }

  @Post("tenants/:tenantSlug/branches/:branchId/bookings")
  createBooking(
    @Param("tenantSlug") tenantSlug: string,
    @Param("branchId") branchId: string,
    @Body() dto: PublicCreateBookingDto,
  ) {
    return this.storefront.createBooking(tenantSlug, branchId, dto);
  }

  @Get("tenants/:tenantSlug/bookings/:confirmationCode")
  findBooking(
    @Param("tenantSlug") tenantSlug: string,
    @Param("confirmationCode") confirmationCode: string,
  ) {
    return this.storefront.findBookingByCode(tenantSlug, confirmationCode);
  }
}