import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
  } from "@nestjs/common";
  
  import { Reflector } from "@nestjs/core";
  import { ROLES_KEY } from "../decorators/roles.decorator.js";
  
  import { MembershipRole } from "../../generated/prisma/client.js";
  import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface.js";
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles =
        this.reflector.getAllAndOverride<MembershipRole[]>(
          ROLES_KEY,
          [context.getHandler(), context.getClass()],
        );
  
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  
      if (!request.tenant) {
        throw new ForbiddenException(
          "Tenant context is missing.",
        );
      }
  
      if (!requiredRoles.includes(request.tenant.role)) {
        throw new ForbiddenException(
          "You do not have permission to perform this action.",
        );
      }
  
      return true;
    }
  }