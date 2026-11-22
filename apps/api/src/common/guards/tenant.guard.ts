import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface.js";
  
  @Injectable()
  export class TenantGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  
      if (!request.user) {
        throw new UnauthorizedException();
      }
  
      const tenantId = request.headers["x-tenant-id"];
  
      if (
        typeof tenantId !== "string" ||
        !tenantId.trim()
      ) {
        throw new ForbiddenException(
          "X-Tenant-ID header is required.",
        );
      }
  
      const membership = await this.prisma.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: request.user.userId,
          },
        },
        include: {
          tenant: true,
        },
      });
  
      if (
        !membership ||
        membership.tenant.status !== "ACTIVE"
      ) {
        throw new ForbiddenException(
          "You do not have access to this hotel business.",
        );
      }
  
      request.tenant = {
        id: membership.tenant.id,
        name: membership.tenant.name,
        role: membership.role,
      };
  
      return true;
    }
  }