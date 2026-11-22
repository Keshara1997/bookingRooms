import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    Matches,
    MaxLength,
    MinLength,
  } from "class-validator";
  
  export class RegisterDto {
    @IsString()
    @Length(2, 100)
    companyName!: string;
  
    @IsString()
    @Length(2, 60)
    firstName!: string;
  
    @IsString()
    @Length(2, 60)
    lastName!: string;
  
    @IsEmail()
    @MaxLength(254)
    email!: string;
  
    @IsString()
    @MinLength(12)
    @MaxLength(128)
    @Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      {
        message:
          "Password must contain uppercase, lowercase, number and special character",
      },
    )
    password!: string;
  
    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;
  }