
import {
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
  } from "class-validator";
  
  // ============================================
  // UPDATE RESERVATION
  // ============================================
  
  export class UpdateReservationDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    adults?: number;
  
    @IsOptional()
    @IsInt()
    @Min(0)
    children?: number;
  
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    specialRequests?: string;
  }
  