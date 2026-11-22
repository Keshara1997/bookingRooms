
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
  } from "class-validator";
  
  import { ReservationStatus } from "../../../generated/prisma/enums.js";
  
  // ============================================
  // SEARCH RESERVATIONS
  // ============================================
  
  export class SearchReservationsDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    confirmationCode?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(255)
    guestName?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(255)
    guestEmail?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(30)
    guestPhone?: string;
  
    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;
  
    @IsOptional()
    @IsDateString()
    checkInFrom?: string;
  
    @IsOptional()
    @IsDateString()
    checkInTo?: string;
  
    @IsOptional()
    @IsDateString()
    checkOutFrom?: string;
  
    @IsOptional()
    @IsDateString()
    checkOutTo?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    roomTypeId?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    branchId?: string;
  }
  