import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateRoomTypeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAdults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxChildren?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  size?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;
}