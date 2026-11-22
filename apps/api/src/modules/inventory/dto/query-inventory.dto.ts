
import {
    IsDateString,
    IsOptional,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  import {
    IsInt,
    Max,
    Min,
  } from "class-validator";
  
  export class QueryInventoryDto {
    @IsDateString()
    from!: string;
  
    @IsDateString()
    to!: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 31;
  }
  