import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from "@nestjs/common";
  
  import { JwtService } from "@nestjs/jwt";
  import { PrismaService } from "../../database/prisma.service.js";
  import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface.js";
  
  interface JwtPayload {
    sub: string;
    sid: string;
  }
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly prisma: PrismaService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  
      const authorization = request.headers.authorization;
  
      if (!authorization?.startsWith("Bearer ")) {
        throw new UnauthorizedException("Access token required.");
      }
  
      const token = authorization.substring(7);
  
      try {
        const payload =
          await this.jwtService.verifyAsync<JwtPayload>(token,{
            issuer: "bookingrooms",
            audience: "bookingrooms-api",   
          });
  
        if (!payload.sub || !payload.sid) {
          throw new UnauthorizedException("Invalid token.");
        }
  
        const session = await this.prisma.authSession.findFirst({
          where: {
            id: payload.sid,
            userId: payload.sub,
            revokedAt: null,
            expiresAt: { gt: new Date() },
            user: {
              status: "ACTIVE",
            },
          },
        });
  
        if (!session) {
          throw new UnauthorizedException(
            "Session is expired or revoked.",
          );
        }
  
        request.user = {
          userId: payload.sub,
          sessionId: payload.sid,
        };
  
        return true;
      } catch {
        throw new UnauthorizedException(
          "Invalid or expired access token.",
        );
      }
    }
  }