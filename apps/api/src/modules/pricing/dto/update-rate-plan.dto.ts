
import { PartialType } from "@nestjs/mapped-types";

import { CreateRatePlanDto } from "./create-rate-plan.dto.js";

export class UpdateRatePlanDto extends PartialType(
  CreateRatePlanDto,
) {}
