
import {
    IsDateString,
    IsInt,
    IsOptional,
    Min,
    Max,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  
  export class QueryDailyRatesDto {
    @IsDateString()
    from!: string;
  
    @IsDateString()
    to!: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 31;
  }
  