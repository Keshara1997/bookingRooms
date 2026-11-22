import { IsDateString, IsNotEmpty } from "class-validator";

export class CalculatePricingDto {
  @IsDateString()
  @IsNotEmpty()
  checkIn!: string;

  @IsDateString()
  @IsNotEmpty()
  checkOut!: string;
}