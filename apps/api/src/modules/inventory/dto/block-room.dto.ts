
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import {
  RoomBlockReason,
} from "../../../generated/prisma/enums.js";

export class BlockRoomDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(RoomBlockReason)
  reason!: RoomBlockReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
