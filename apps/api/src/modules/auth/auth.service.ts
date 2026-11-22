
import {
    ConflictException,
    Injectable,
    UnauthorizedException,
  } from "@nestjs/common";
  
  import { JwtService } from "@nestjs/jwt";
  import { ConfigService } from "@nestjs/config";
  
  import * as argon2 from "argon2";
  import {
    createHash,
    randomBytes,
  } from "node:crypto";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { RegisterDto } from "./dto/register.dto.js";
  import { LoginDto } from "./dto/login.dto.js";
  
  const SESSION_DURATION_DAYS = 30;
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
    ) {}
  
    private hashToken(token: string): string {
      return createHash("sha256")
        .update(token)
        .digest("hex");
    }
  
    private createRefreshSecret(): string {
      return randomBytes(48).toString("base64url");
    }
  
    private createTenantSlug(name: string): string {
      const base = name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 45);
  
      return `${base || "hotel"}-${randomBytes(4).toString("hex")}`;
    }
  
    private async createSession(
      userId: string,
      userAgent?: string,
      ipAddress?: string,
    ) {
      const secret = this.createRefreshSecret();
      const expiresAt = new Date();
  
      expiresAt.setDate(
        expiresAt.getDate() + SESSION_DURATION_DAYS,
      );
  
      const session = await this.prisma.authSession.create({
        data: {
          userId,
          tokenHash: this.hashToken(secret),
          expiresAt,
          userAgent,
          ipAddress,
        },
      });
  
      return {
        sessionId: session.id,
        refreshToken: `${session.id}.${secret}`,
        expiresAt,
      };
    }
  
    private async issueAccessToken(
      userId: string,
      sessionId: string,
    ) {
      return this.jwtService.signAsync({
        sub: userId,
        sid: sessionId,
      });
    }
  
    private async createAuthResponse(
      userId: string,
      sessionId: string,
      refreshToken: string,
      extra: Record<string, unknown> = {},
    ) {
      const accessToken = await this.issueAccessToken(
        userId,
        sessionId,
      );
  
      return {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 900,
        refreshToken,
        ...extra,
      };
    }
  
    // ==========================================
    // REGISTER
    // ==========================================
  
    async register(
      dto: RegisterDto,
      userAgent?: string,
      ipAddress?: string,
    ) {
      const email = dto.email.trim().toLowerCase();
  
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
  
      if (existingUser) {
        throw new ConflictException(
          "An account with this email already exists.",
        );
      }
  
      const passwordHash = await argon2.hash(dto.password, {
        type: argon2.argon2id,
      });
  
      const result = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phone: dto.phone?.trim(),
            },
          });
  
          const tenant = await tx.tenant.create({
            data: {
              name: dto.companyName.trim(),
              slug: this.createTenantSlug(dto.companyName),
              email,
            },
          });
  
          await tx.membership.create({
            data: {
              userId: user.id,
              tenantId: tenant.id,
              role: "OWNER",
            },
          });
  
          return { user, tenant };
        },
      );
  
      const session = await this.createSession(
        result.user.id,
        userAgent,
        ipAddress,
      );
  
      return this.createAuthResponse(
        result.user.id,
        session.sessionId,
        session.refreshToken,
        {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
          },
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            slug: result.tenant.slug,
            role: "OWNER",
          },
        },
      );
    }
  
    // ==========================================
    // LOGIN
    // ==========================================
  
    async login(
      dto: LoginDto,
      userAgent?: string,
      ipAddress?: string,
    ) {
      const email = dto.email.trim().toLowerCase();
  
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              tenant: true,
            },
          },
        },
      });
  
      if (!user) {
        throw new UnauthorizedException(
          "Invalid email or password.",
        );
      }
  
      const validPassword = await argon2.verify(
        user.passwordHash,
        dto.password,
      );
  
      if (!validPassword) {
        throw new UnauthorizedException(
          "Invalid email or password.",
        );
      }
  
      if (user.status !== "ACTIVE") {
        throw new UnauthorizedException(
          "Your account is not active.",
        );
      }
  
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
  
      const session = await this.createSession(
        user.id,
        userAgent,
        ipAddress,
      );
  
      return this.createAuthResponse(
        user.id,
        session.sessionId,
        session.refreshToken,
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            memberships: user.memberships.map((membership) => ({
              tenantId: membership.tenantId,
              tenantName: membership.tenant.name,
              role: membership.role,
            })),
          },
        },
      );
    }
  
    // ==========================================
    // REFRESH TOKEN ROTATION
    // ==========================================
  
    async refresh(refreshToken?: string) {
      if (!refreshToken) {
        throw new UnauthorizedException(
          "Refresh token is missing.",
        );
      }
  
      const separator = refreshToken.indexOf(".");
  
      if (separator < 1) {
        throw new UnauthorizedException(
          "Invalid refresh token.",
        );
      }
  
      const sessionId = refreshToken.slice(0, separator);
      const secret = refreshToken.slice(separator + 1);
  
      if (!secret || secret.length > 256) {
        throw new UnauthorizedException(
          "Invalid refresh token.",
        );
      }
  
      const session = await this.prisma.authSession.findUnique({
        where: { id: sessionId },
      });
  
      if (!session) {
        throw new UnauthorizedException(
          "Session not found.",
        );
      }
  
      if (
        session.revokedAt ||
        session.expiresAt <= new Date()
      ) {
        throw new UnauthorizedException(
          "Session has expired or been revoked.",
        );
      }
  
      const oldHash = this.hashToken(secret);
  
      if (oldHash !== session.tokenHash) {
        await this.prisma.authSession.updateMany({
          where: {
            id: session.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
  
        throw new UnauthorizedException(
          "Refresh token reuse detected. Please log in again.",
        );
      }
  
      const newSecret = this.createRefreshSecret();
      const newExpiresAt = new Date();
  
      newExpiresAt.setDate(
        newExpiresAt.getDate() + SESSION_DURATION_DAYS,
      );
  
      const rotation = await this.prisma.authSession.updateMany({
        where: {
          id: session.id,
          tokenHash: oldHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          tokenHash: this.hashToken(newSecret),
          expiresAt: newExpiresAt,
          lastUsedAt: new Date(),
        },
      });
  
      if (rotation.count !== 1) {
        await this.prisma.authSession.updateMany({
          where: {
            id: session.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
  
        throw new UnauthorizedException(
          "Session rotation failed. Please log in again.",
        );
      }
  
      const refreshTokenValue =
        `${session.id}.${newSecret}`;
  
      return this.createAuthResponse(
        session.userId,
        session.id,
        refreshTokenValue,
      );
    }
  
    // ==========================================
    // LOGOUT
    // ==========================================
  
    async logout(refreshToken?: string) {
      if (refreshToken) {
        const separator = refreshToken.indexOf(".");
  
        if (separator > 0) {
          const sessionId = refreshToken.slice(0, separator);
  
          await this.prisma.authSession.updateMany({
            where: {
              id: sessionId,
              revokedAt: null,
            },
            data: {
              revokedAt: new Date(),
            },
          });
        }
      }
  
      return {
        message: "Logged out successfully.",
      };
    }
  
    // ==========================================
    // LOGOUT ALL DEVICES
    // ==========================================
  
    async logoutAll(userId: string) {
      await this.prisma.authSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
  
      return {
        message: "All sessions have been revoked.",
      };
    }
  
    // ==========================================
    // CURRENT USER
    // ==========================================
  
    async getProfile(userId: string) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                },
              },
            },
          },
        },
      });
  
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedException(
          "User account is unavailable.",
        );
      }
  
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        memberships: user.memberships.map((membership) => ({
          tenant: membership.tenant,
          role: membership.role,
        })),
      };
    }
  }
  