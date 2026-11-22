
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    MinLength,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  
  import {
    CancellationPolicy,
    MealPlan,
  } from "../../../generated/prisma/enums.js";
  
  export class CreateRatePlanDto {
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
    @IsEnum(MealPlan)
    mealPlan?: MealPlan;
  
    @IsOptional()
    @IsEnum(CancellationPolicy)
    cancellationPolicy?: CancellationPolicy;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    cancellationDeadlineHours?: number;
  
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100)
    cancellationFeePercent?: number;
  
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
    isRefundable?: boolean;
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
  }
  