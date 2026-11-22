
import {
    IsBoolean,
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    Min,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  
  export class CreateDailyRateDto {
    @IsDateString()
    date!: string;
  
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price!: number;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    minStayNights?: number;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxStayNights?: number;
  
    @IsOptional()
    @IsBoolean()
    isClosed?: boolean;
  
    @IsOptional()
    @IsBoolean()
    closedToArrival?: boolean;
  
    @IsOptional()
    @IsBoolean()
    closedToDeparture?: boolean;
  }
  