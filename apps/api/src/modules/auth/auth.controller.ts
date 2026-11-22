
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
  } from "@nestjs/common";
  
  import type { Request, Response } from "express";
  import { ConfigService } from "@nestjs/config";
  
  import { AuthService } from "./auth.service.js";
  import { RegisterDto } from "./dto/register.dto.js";
  import { LoginDto } from "./dto/login.dto.js";
  
  import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js";
  import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
  
  import { AuthenticatedUser } from "../../common/interfaces/authenticated-request.interface.js";
  
  @Controller("auth")
  export class AuthController {
    constructor(
      private readonly authService: AuthService,
      private readonly config: ConfigService,
    ) {}
  
    private cookieOptions() {
      return {
        httpOnly: true,
        secure: this.config.get("COOKIE_SECURE") === "true",
        sameSite: "lax" as const,
        path: "/api/v1/auth",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      };
    }
  
    private setRefreshCookie(
      response: Response,
      token: string,
    ) {
      response.cookie(
        this.config.get("COOKIE_NAME") ?? "br_refresh",
        token,
        this.cookieOptions(),
      );
    }
  
    private clearRefreshCookie(response: Response) {
      response.clearCookie(
        this.config.get("COOKIE_NAME") ?? "br_refresh",
        {
          httpOnly: true,
          secure: this.config.get("COOKIE_SECURE") === "true",
          sameSite: "lax",
          path: "/api/v1/auth",
        },
      );
    }
  
    private getRefreshCookie(request: Request) {
      const cookies = request.cookies as
        | Record<string, string>
        | undefined;
  
      return cookies?.[
        this.config.get("COOKIE_NAME") ?? "br_refresh"
      ];
    }
  
    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    async register(
      @Body() dto: RegisterDto,
      @Req() request: Request,
      @Res({ passthrough: true }) response: Response,
    ) {
      const result = await this.authService.register(
        dto,
        request.get("user-agent"),
        request.ip,
      );
  
      const { refreshToken, ...body } = result;
  
      this.setRefreshCookie(response, refreshToken);
  
      return body;
    }
  
    @Post("login")
    @HttpCode(HttpStatus.OK)
    async login(
      @Body() dto: LoginDto,
      @Req() request: Request,
      @Res({ passthrough: true }) response: Response,
    ) {
      const result = await this.authService.login(
        dto,
        request.get("user-agent"),
        request.ip,
      );
  
      const { refreshToken, ...body } = result;
  
      this.setRefreshCookie(response, refreshToken);
  
      return body;
    }
  
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    async refresh(
      @Req() request: Request,
      @Res({ passthrough: true }) response: Response,
    ) {
      const result = await this.authService.refresh(
        this.getRefreshCookie(request),
      );
  
      const { refreshToken, ...body } = result;
  
      this.setRefreshCookie(response, refreshToken);
  
      return body;
    }
  
    @Post("logout")
    @HttpCode(HttpStatus.OK)
    async logout(
      @Req() request: Request,
      @Res({ passthrough: true }) response: Response,
    ) {
      await this.authService.logout(
        this.getRefreshCookie(request),
      );
  
      this.clearRefreshCookie(response);
  
      return {
        message: "Logged out successfully.",
      };
    }
  
    @Post("logout-all")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logoutAll(
      @CurrentUser() user: AuthenticatedUser,
      @Res({ passthrough: true }) response: Response,
    ) {
      const result = await this.authService.logoutAll(user.userId);
  
      this.clearRefreshCookie(response);
  
      return result;
    }
  
    @Get("me")
    @UseGuards(JwtAuthGuard)
    async me(
      @CurrentUser() user: AuthenticatedUser,
    ) {
      return this.authService.getProfile(user.userId);
    }
  }
  