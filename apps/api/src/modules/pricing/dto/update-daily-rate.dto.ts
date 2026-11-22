
import { PartialType } from "@nestjs/mapped-types";

import { CreateDailyRateDto } from "./create-daily-rate.dto.js";

export class UpdateDailyRateDto extends PartialType(
  CreateDailyRateDto,
) {}
