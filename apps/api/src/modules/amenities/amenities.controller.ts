import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";

import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { AmenitiesService } from "./amenities.service.js";
import { CreateAmenityDto } from "./dto/create-amenity.dto.js";
import { UpdateAmenityDto } from "./dto/update-amenity.dto.js";
import { SetRoomTypeAmenitiesDto } from "./dto/set-room-type-amenities.dto.js";

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Post("amenities")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateAmenityDto,
  ) {
    return this.amenitiesService.create(tenantId, dto);
  }

  @Get("amenities")
  findAll(@CurrentTenant() tenantId: string) {
    return this.amenitiesService.findAll(tenantId);
  }

  @Get("amenities/:amenityId")
  findOne(
    @CurrentTenant() tenantId: string,
    @Param("amenityId") amenityId: string,
  ) {
    return this.amenitiesService.findOne(tenantId, amenityId);
  }

  @Patch("amenities/:amenityId")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
  update(
    @CurrentTenant() tenantId: string,
    @Param("amenityId") amenityId: string,
    @Body() dto: UpdateAmenityDto,
  ) {
    return this.amenitiesService.update(tenantId, amenityId, dto);
  }

  @Delete("amenities/:amenityId")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
  remove(
    @CurrentTenant() tenantId: string,
    @Param("amenityId") amenityId: string,
  ) {
    return this.amenitiesService.remove(tenantId, amenityId);
  }

  @Get("room-types/:roomTypeId/amenities")
  getRoomTypeAmenities(
    @CurrentTenant() tenantId: string,
    @Param("roomTypeId") roomTypeId: string,
  ) {
    return this.amenitiesService.getRoomTypeAmenities(
      tenantId,
      roomTypeId,
    );
  }

  @Put("room-types/:roomTypeId/amenities")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
  setRoomTypeAmenities(
    @CurrentTenant() tenantId: string,
    @Param("roomTypeId") roomTypeId: string,
    @Body() dto: SetRoomTypeAmenitiesDto,
  ) {
    return this.amenitiesService.setRoomTypeAmenities(
      tenantId,
      roomTypeId,
      dto.amenityIds,
    );
  }
}