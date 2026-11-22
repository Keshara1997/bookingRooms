import { IsOptional, IsString, Length, MaxLength } from "class-validator";

export class CreateBranchDto {
  @IsString()
  @Length(2, 150)
  name!: string;

  @IsString()
  @Length(2, 30)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}