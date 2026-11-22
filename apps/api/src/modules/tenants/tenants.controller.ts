import {
    Controller,
    Get,
    UseGuards,
  } from "@nestjs/common";
  
  import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
  import { TenantGuard } from "../../common/guards/tenant.guard.js";
  import { RolesGuard } from "../../common/guards/roles.guard.js";
  
  import { AuthenticatedRequest } from "../../common/interfaces/authenticated-request.interface.js";
  import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
  
  import { MembershipRole } from "../../generated/prisma/client.js";
  
  import { Req } from "@nestjs/common";
  
  @Controller("tenants")
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  export class TenantsController {
    @Get("current")
    getCurrentTenant(@Req() request: AuthenticatedRequest) {
      return {
        tenant: request.tenant,
      };
    }
  
    @Get("my-memberships")
    getMyMemberships(
      @CurrentUser() user: { userId: string },
    ) {
      return {
        userId: user.userId,
        message: "Use GET /auth/me to retrieve your memberships.",
      };
    }
  }