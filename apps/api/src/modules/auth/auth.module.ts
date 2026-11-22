import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

import { PrismaModule } from "../../database/prisma.module.js";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: "15m",
          issuer: "bookingrooms",
          audience: "bookingrooms-api",
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
  ],

  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}