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

import { InventoryService } from "./inventory.service.js";
import { AvailabilityService } from "./availability.service.js";
import { RoomBlocksService } from "./room-blocks.service.js";

import { CreateInventoryDto } from "./dto/create-inventory.dto.js";
import { UpdateInventoryDto } from "./dto/update-inventory.dto.js";
import { QueryInventoryDto } from "./dto/query-inventory.dto.js";
import { CheckAvailabilityDto } from "./dto/check-availability.dto.js";
import { BlockRoomDto } from "./dto/block-room.dto.js";

const INVENTORY_MANAGE_ROLES = [
  "OWNER",
  "ADMIN",
  "HOTEL_MANAGER",
] as const;

const INVENTORY_READ_ROLES = [
  "OWNER",
  "ADMIN",
  "HOTEL_MANAGER",
  "RECEPTIONIST",
  "ACCOUNTANT",
] as const;

const AVAILABILITY_ROLES = [
  "OWNER",
  "ADMIN",
  "HOTEL_MANAGER",
  "RECEPTIONIST",
] as const;

const ROOM_BLOCK_ROLES = [
  "OWNER",
  "ADMIN",
  "HOTEL_MANAGER",
  "HOUSEKEEPING",
] as const;

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly availabilityService: AvailabilityService,
    private readonly roomBlocksService: RoomBlocksService,
  ) {}

  @Post("branches/:branchId/inventory")
  @Roles(...INVENTORY_MANAGE_ROLES)
  createInventory(
    @CurrentTenant() tenantId: string,
    @Param("branchId") branchId: string,
    @Body() dto: CreateInventoryDto,
  ) {
    return this.inventoryService.create(tenantId, branchId, dto);
  }

  @Get("branches/:branchId/inventory")
  @Roles(...INVENTORY_READ_ROLES)
  findAllInventory(
    @CurrentTenant() tenantId: string,
    @Param("branchId") branchId: string,
    @Query() query: QueryInventoryDto,
  ) {
    return this.inventoryService.findAll(tenantId, branchId, query);
  }

  @Get("branches/:branchId/inventory/:inventoryId")
  @Roles(...INVENTORY_READ_ROLES)
  findOneInventory(
    @CurrentTenant() tenantId: string,
    @Param("branchId") branchId: string,
    @Param("inventoryId") inventoryId: string,
  ) {
    return this.inventoryService.findOne(tenantId, branchId, inventoryId);
  }

  @Patch("branches/:branchId/inventory/:inventoryId")
  @Roles(...INVENTORY_MANAGE_ROLES)
  updateInventory(
    @CurrentTenant() tenantId: string,
    @Param("branchId") branchId: string,
    @Param("inventoryId") inventoryId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(
      tenantId,
      branchId,
      inventoryId,
      dto,
    );
  }

  @Post("branches/:branchId/availability")
  @Roles(...AVAILABILITY_ROLES)
  checkAvailability(
    @CurrentTenant() tenantId: string,
    @Param("branchId") branchId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.availabilityService.checkAvailability(
      tenantId,
      branchId,
      dto,
    );
  }

  @Post("rooms/:roomId/blocks")
  @Roles(...ROOM_BLOCK_ROLES)
  createRoomBlock(
    @CurrentTenant() tenantId: string,
    @Param("roomId") roomId: string,
    @Body() dto: BlockRoomDto,
  ) {
    return this.roomBlocksService.create(tenantId, roomId, dto);
  }

  @Get("rooms/:roomId/blocks")
  @Roles(...ROOM_BLOCK_ROLES)
  findRoomBlocks(
    @CurrentTenant() tenantId: string,
    @Param("roomId") roomId: string,
  ) {
    return this.roomBlocksService.findAll(tenantId, roomId);
  }

  @Patch("room-blocks/:roomBlockId/cancel")
  @Roles(...ROOM_BLOCK_ROLES)
  cancelRoomBlock(
    @CurrentTenant() tenantId: string,
    @Param("roomBlockId") roomBlockId: string,
  ) {
    return this.roomBlocksService.cancel(tenantId, roomBlockId);
  }
}