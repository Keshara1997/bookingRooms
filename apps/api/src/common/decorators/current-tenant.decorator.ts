import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";

import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface.js";

export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.tenant?.id) {
      throw new ForbiddenException("Tenant context is missing.");
    }

    return request.tenant.id;
  },
);