import type { Request } from "express";
import type { MembershipRole } from "../../generated/prisma/client.js";

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedTenant {
  id: string;
  name: string;
  role: MembershipRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tenant?: AuthenticatedTenant;
}