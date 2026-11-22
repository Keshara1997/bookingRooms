import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
  } from "@nestjs/common";
  
  import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
  import { TenantGuard } from "../../common/guards/tenant.guard.js";
  import { RolesGuard } from "../../common/guards/roles.guard.js";
  import { Roles } from "../../common/decorators/roles.decorator.js";
  import { AuthenticatedRequest } from "../../common/interfaces/authenticated-request.interface.js";
  
  import { HotelsService } from "../hotels/hotels.service.js";
  import { CreateHotelDto } from "../hotels/dto/create-hotel.dto.js";
  import { UpdateHotelDto } from "../hotels/dto/update-hotel.dto.js";
  
  @Controller("hotels")
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class HotelsController {
    constructor(private readonly hotelsService: HotelsService) {}
  
    @Post()
    @Roles("OWNER", "ADMIN")
    create(
      @Req() request: AuthenticatedRequest,
      @Body() dto: CreateHotelDto,
    ) {
      return this.hotelsService.create(request.tenant!.id, dto);
    }
  
    @Get()
    findAll(@Req() request: AuthenticatedRequest) {
      return this.hotelsService.findAll(request.tenant!.id);
    }
  
    @Get(":hotelId")
    findOne(
      @Req() request: AuthenticatedRequest,
      @Param("hotelId") hotelId: string,
    ) {
      return this.hotelsService.findOne(request.tenant!.id, hotelId);
    }
  
    @Patch(":hotelId")
    @Roles("OWNER", "ADMIN")
    update(
      @Req() request: AuthenticatedRequest,
      @Param("hotelId") hotelId: string,
      @Body() dto: UpdateHotelDto,
    ) {
      return this.hotelsService.update(
        request.tenant!.id,
        hotelId,
        dto,
      );
    }
  
    @Delete(":hotelId")
    @Roles("OWNER", "ADMIN")
    archive(
      @Req() request: AuthenticatedRequest,
      @Param("hotelId") hotelId: string,
    ) {
      return this.hotelsService.archive(
        request.tenant!.id,
        hotelId,
      );
    }
  }