
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
    ValidateNested,
    MaxLength,
  } from "class-validator";
  
  import { Type } from "class-transformer";
  
  import { ReservationSource } from "../../../generated/prisma/enums.js";
  
  // ============================================
  // GUEST DETAILS
  // ============================================
  
  export class ReservationGuestDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;
  
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;
  
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    address?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
  }
  
  // ============================================
  // RESERVATION ROOM DETAILS
  // One entry represents one booked room.
  // ============================================
  
  export class ReservationRoomDto {
    @IsString()
    @MinLength(1)
    roomTypeId!: string;
  
    @IsString()
    @MinLength(1)
    ratePlanId!: string;
  
    @IsOptional()
    @IsString()
    @MinLength(1)
    roomId?: string;
  }
  
  // ============================================
  // CREATE RESERVATION
  // ============================================
  
  export class CreateReservationDto {
    @ValidateNested()
    @Type(() => ReservationGuestDto)
    guest!: ReservationGuestDto;
  
    @IsDateString()
    checkIn!: string;
  
    @IsDateString()
    checkOut!: string;
  
    @IsInt()
    @Min(1)
    adults!: number;
  
    @IsInt()
    @Min(0)
    children!: number;
  
    @IsOptional()
    @IsEnum(ReservationSource)
    source?: ReservationSource;
  
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    specialRequests?: string;
  
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReservationRoomDto)
    rooms!: ReservationRoomDto[];
  }
  