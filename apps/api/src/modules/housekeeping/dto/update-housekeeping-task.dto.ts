import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import { HousekeepingStatus } from "../../../generated/prisma/enums.js";

export class UpdateHousekeepingTaskDto {
  @IsOptional()
  @IsEnum(HousekeepingStatus)
  status?: HousekeepingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}