import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Controller("health")
export class DatabaseHealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      application: "bookingRooms",
      database: "connected",
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }
}