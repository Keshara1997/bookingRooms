
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
  } from "@nestjs/common";
  
  import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
  import { TenantGuard } from "../../common/guards/tenant.guard.js";
  import { RolesGuard } from "../../common/guards/roles.guard.js";
  
  import { Roles } from "../../common/decorators/roles.decorator.js";
  
  import { AuthenticatedRequest } from "../../common/interfaces/authenticated-request.interface.js";
  
  import { RoomsService } from "./rooms.service.js";
  
  import { CreateRoomDto } from "./dto/create-room.dto.js";
  import { UpdateRoomDto } from "./dto/update-room.dto.js";
  import { QueryRoomsDto } from "./dto/query-rooms.dto.js";
  import { UpdateRoomStatusDto } from "./dto/update-room-status.dto.js";
  
  @Controller()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class RoomsController {
    constructor(
      private readonly roomsService: RoomsService,
    ) {}
  
    /**
     * Create a room inside a branch.
     */
    @Post("branches/:branchId/rooms")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
    create(
      @Req() request: AuthenticatedRequest,
      @Param("branchId") branchId: string,
      @Body() dto: CreateRoomDto,
    ) {
      return this.roomsService.create(
        request.tenant!.id,
        branchId,
        dto,
      );
    }
  
    /**
     * List rooms belonging to a branch.
     */
    @Get("branches/:branchId/rooms")
    findAll(
      @Req() request: AuthenticatedRequest,
      @Param("branchId") branchId: string,
      @Query() query: QueryRoomsDto,
    ) {
      return this.roomsService.findAll(
        request.tenant!.id,
        branchId,
        query,
      );
    }
  
    /**
     * Get a single room.
     */
    @Get("rooms/:roomId")
    findOne(
      @Req() request: AuthenticatedRequest,
      @Param("roomId") roomId: string,
    ) {
      return this.roomsService.findOne(
        request.tenant!.id,
        roomId,
      );
    }
  
    /**
     * Update room information.
     */
    @Patch("rooms/:roomId")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
    update(
      @Req() request: AuthenticatedRequest,
      @Param("roomId") roomId: string,
      @Body() dto: UpdateRoomDto,
    ) {
      return this.roomsService.update(
        request.tenant!.id,
        roomId,
        dto,
      );
    }
  
    /**
     * Update room status.
     */
    @Patch("rooms/:roomId/status")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
    updateStatus(
      @Req() request: AuthenticatedRequest,
      @Param("roomId") roomId: string,
      @Body() dto: UpdateRoomStatusDto,
    ) {
      return this.roomsService.updateStatus(
        request.tenant!.id,
        roomId,
        dto,
      );
    }
  
    /**
     * Permanently remove a room.
     */
    @Delete("rooms/:roomId")
    @Roles("OWNER", "ADMIN")
    remove(
      @Req() request: AuthenticatedRequest,
      @Param("roomId") roomId: string,
    ) {
      return this.roomsService.remove(
        request.tenant!.id,
        roomId,
      );
    }
  }
  