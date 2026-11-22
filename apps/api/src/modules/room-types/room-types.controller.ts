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
  } from '@nestjs/common';
  
  import { RoomTypesService } from './room-types.service';
  import { CreateRoomTypeDto } from './dto/create-room-type.dto';
  import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
  import { QueryRoomTypesDto } from './dto/query-room-types.dto';
  
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { TenantGuard } from '../../common/guards/tenant.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
  
  @Controller()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class RoomTypesController {
    constructor(
      private readonly roomTypesService: RoomTypesService,
    ) {}
  
    @Post('hotels/:hotelId/room-types')
    @Roles('OWNER', 'ADMIN', 'HOTEL_MANAGER')
    create(
      @CurrentTenant() tenantId: string,
      @Param('hotelId') hotelId: string,
      @Body() dto: CreateRoomTypeDto,
    ) {
      return this.roomTypesService.create(
        tenantId,
        hotelId,
        dto,
      );
    }
  
    @Get('hotels/:hotelId/room-types')
    findAll(
      @CurrentTenant() tenantId: string,
      @Param('hotelId') hotelId: string,
      @Query() query: QueryRoomTypesDto,
    ) {
      return this.roomTypesService.findAll(
        tenantId,
        hotelId,
        query,
      );
    }
  
    @Get('room-types/:id')
    findOne(
      @CurrentTenant() tenantId: string,
      @Param('id') id: string,
    ) {
      return this.roomTypesService.findOne(tenantId, id);
    }
  
    @Patch('room-types/:id')
    @Roles('OWNER', 'ADMIN', 'HOTEL_MANAGER')
    update(
      @CurrentTenant() tenantId: string,
      @Param('id') id: string,
      @Body() dto: UpdateRoomTypeDto,
    ) {
      return this.roomTypesService.update(
        tenantId,
        id,
        dto,
      );
    }
  
    @Delete('room-types/:id')
    @Roles('OWNER', 'ADMIN', 'HOTEL_MANAGER')
    archive(
      @CurrentTenant() tenantId: string,
      @Param('id') id: string,
    ) {
      return this.roomTypesService.archive(tenantId, id);
    }
  }