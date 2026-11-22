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
  
  import { BranchesService } from "./branches.service.js";
  import { CreateBranchDto } from "./dto/create-branch.dto.js";
  import { UpdateBranchDto } from "./dto/update-branch.dto.js";
  
  @Controller()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class BranchesController {
    constructor(private readonly branchesService: BranchesService) {}
  
    @Post("hotels/:hotelId/branches")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
    create(
      @Req() request: AuthenticatedRequest,
      @Param("hotelId") hotelId: string,
      @Body() dto: CreateBranchDto,
    ) {
      return this.branchesService.create(
        request.tenant!.id,
        hotelId,
        dto,
      );
    }
  
    @Get("hotels/:hotelId/branches")
    findAll(
      @Req() request: AuthenticatedRequest,
      @Param("hotelId") hotelId: string,
    ) {
      return this.branchesService.findAll(
        request.tenant!.id,
        hotelId,
      );
    }
  
    @Get("branches/:branchId")
    findOne(
      @Req() request: AuthenticatedRequest,
      @Param("branchId") branchId: string,
    ) {
      return this.branchesService.findOne(
        request.tenant!.id,
        branchId,
      );
    }
  
    @Patch("branches/:branchId")
    @Roles("OWNER", "ADMIN", "HOTEL_MANAGER")
    update(
      @Req() request: AuthenticatedRequest,
      @Param("branchId") branchId: string,
      @Body() dto: UpdateBranchDto,
    ) {
      return this.branchesService.update(
        request.tenant!.id,
        branchId,
        dto,
      );
    }
  
    @Delete("branches/:branchId")
    @Roles("OWNER", "ADMIN")
    archive(
      @Req() request: AuthenticatedRequest,
      @Param("branchId") branchId: string,
    ) {
      return this.branchesService.archive(
        request.tenant!.id,
        branchId,
      );
    }
  }