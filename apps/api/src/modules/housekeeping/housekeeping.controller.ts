import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CurrentTenant } from "../../common/decorators/current-tenant.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
import { TenantGuard } from "../../common/guards/tenant.guard.js";
import { RolesGuard } from "../../common/guards/roles.guard.js";
import { UpdateHousekeepingTaskDto } from "./dto/update-housekeeping-task.dto.js";
import { HousekeepingService } from "./housekeeping.service.js";

@Controller()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class HousekeepingController {
  constructor(private readonly housekeeping: HousekeepingService) {}

  @Get("branches/:branchId/housekeeping-tasks")
  @Roles(
    "OWNER",
    "ADMIN",
    "HOTEL_MANAGER",
    "HOUSEKEEPING",
    "RECEPTIONIST",
  )
  findByBranch(
    @CurrentTenant() tenantId: string,
    @Param("branchId") branchId: string,
  ) {
    return this.housekeeping.findByBranch(tenantId, branchId);
  }

  @Patch("housekeeping-tasks/:taskId")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "HOUSEKEEPING")
  update(
    @CurrentTenant() tenantId: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateHousekeepingTaskDto,
  ) {
    return this.housekeeping.updateTask(tenantId, taskId, dto);
  }

  @Post("housekeeping-tasks/:taskId/start")
  @Roles("OWNER", "ADMIN", "HOTEL_MANAGER", "HOUSEKEEPING")
  start(
    @CurrentTenant() tenantId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.housekeeping.startTask(tenantId, taskId);
  }
}