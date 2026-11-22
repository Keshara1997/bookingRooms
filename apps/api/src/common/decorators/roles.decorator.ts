import { SetMetadata } from "@nestjs/common";
import { MembershipRole } from "../../generated/prisma/client.js";

export const ROLES_KEY = "required_roles";

export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata(ROLES_KEY, roles);