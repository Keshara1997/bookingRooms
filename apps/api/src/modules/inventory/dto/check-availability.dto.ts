
import {
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  
  export class CheckAvailabilityDto {
    @IsString()
    @MinLength(1)
    roomTypeId!: string;
  
    @IsDateString()
    checkIn!: string;
  
    @IsDateString()
    checkOut!: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    adults: number = 1;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    children: number = 0;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    rooms: number = 1;
  }
  