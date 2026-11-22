
import {
    IsOptional,
    IsString,
    MaxLength,
  } from "class-validator";
  
  // ============================================
  // CANCEL RESERVATION
  // ============================================
  
  export class CancelReservationDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    cancellationReason?: string;
  }
  