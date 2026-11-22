
import {
    IsDateString,
    IsInt,
    IsString,
    Min,
    MinLength,
  } from "class-validator";
  
  export class CreateInventoryDto {
    @IsString()
    @MinLength(1)
    roomTypeId!: string;
  
    @IsDateString()
    date!: string;
  
    @IsInt()
    @Min(0)
    totalRooms!: number;
  }
  