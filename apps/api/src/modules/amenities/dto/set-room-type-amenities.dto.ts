import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class SetRoomTypeAmenitiesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  amenityIds!: string[];
}