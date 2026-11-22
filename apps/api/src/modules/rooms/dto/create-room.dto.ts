import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
  } from 'class-validator';
  
  import { Type } from 'class-transformer';
  
  export class CreateRoomDto {
    @IsString()
    @IsNotEmpty()
    roomTypeId!: string;
  
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(30)
    roomNumber!: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    floor?: number;
  }