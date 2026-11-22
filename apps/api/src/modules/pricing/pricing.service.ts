
import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { CreateRatePlanDto } from "./dto/create-rate-plan.dto.js";
  import { UpdateRatePlanDto } from "./dto/update-rate-plan.dto.js";
  import { QueryRatePlansDto } from "./dto/query-rate-plans.dto.js";
  
  @Injectable()
  export class PricingService {
    constructor(
      private readonly prisma: PrismaService,
    ) {}
  
    // ============================================
    // VERIFY ROOM TYPE
    // ============================================
  
    private async ensureRoomTypeExists(
      tenantId: string,
      roomTypeId: string,
    ) {
      const roomType = await this.prisma.roomType.findFirst({
        where: {
          id: roomTypeId,
          tenantId,
        },
        include: {
          hotel: true,
        },
      });
  
      if (!roomType) {
        throw new NotFoundException(
          "Room type not found.",
        );
      }
  
      if (roomType.hotel.tenantId !== tenantId) {
        throw new NotFoundException(
          "Room type not found.",
        );
      }
  
      return roomType;
    }
  
    // ============================================
    // CREATE RATE PLAN
    // ============================================
  
    async create(
      tenantId: string,
      roomTypeId: string,
      dto: CreateRatePlanDto,
    ) {
      const roomType = await this.ensureRoomTypeExists(
        tenantId,
        roomTypeId,
      );
  
      const code = dto.code.trim().toUpperCase();
  
      try {
        const ratePlan = await this.prisma.ratePlan.create({
          data: {
            tenantId,
            hotelId: roomType.hotelId,
            roomTypeId: roomType.id,
  
            name: dto.name.trim(),
            code,
            description: dto.description?.trim(),
  
            mealPlan: dto.mealPlan,
            cancellationPolicy: dto.cancellationPolicy,
            cancellationDeadlineHours:
              dto.cancellationDeadlineHours,
            cancellationFeePercent:
              dto.cancellationFeePercent,
  
            minStayNights: dto.minStayNights,
            maxStayNights: dto.maxStayNights,
  
            isRefundable: dto.isRefundable,
            isActive: dto.isActive,
          },
  
          include: {
            roomType: true,
            hotel: true,
          },
        });
  
        return ratePlan;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "A rate plan with this code already exists for this room type.",
          );
        }
  
        throw error;
      }
    }
  
    // ============================================
    // GET ALL RATE PLANS
    // ============================================
  
    async findAll(
      tenantId: string,
      roomTypeId: string,
      query: QueryRatePlansDto,
    ) {
      await this.ensureRoomTypeExists(
        tenantId,
        roomTypeId,
      );
  
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;
  
      const search = query.search?.trim();
  
      const where = {
        tenantId,
        roomTypeId,
  
        ...(query.isActive !== undefined
          ? { isActive: query.isActive }
          : {}),
  
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  code: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      };
  
      const [ratePlans, total] = await Promise.all([
        this.prisma.ratePlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            roomType: true,
            hotel: true,
          },
        }),
  
        this.prisma.ratePlan.count({
          where,
        }),
      ]);
  
      return {
        data: ratePlans,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  
    // ============================================
    // GET ONE RATE PLAN
    // ============================================
  
    async findOne(
      tenantId: string,
      ratePlanId: string,
    ) {
      const ratePlan = await this.prisma.ratePlan.findFirst({
        where: {
          id: ratePlanId,
          tenantId,
        },
        include: {
          hotel: true,
          roomType: true,
        },
      });
  
      if (!ratePlan) {
        throw new NotFoundException(
          "Rate plan not found.",
        );
      }
  
      return ratePlan;
    }
  
    // ============================================
    // UPDATE RATE PLAN
    // ============================================
  
    async update(
      tenantId: string,
      ratePlanId: string,
      dto: UpdateRatePlanDto,
    ) {
      await this.findOne(
        tenantId,
        ratePlanId,
      );
  
      const data = {
        ...dto,
  
        ...(dto.name !== undefined
          ? { name: dto.name.trim() }
          : {}),
  
        ...(dto.code !== undefined
          ? { code: dto.code.trim().toUpperCase() }
          : {}),
  
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
      };
  
      try {
        await this.prisma.ratePlan.updateMany({
          where: {
            id: ratePlanId,
            tenantId,
          },
          data,
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "A rate plan with this code already exists for this room type.",
          );
        }
  
        throw error;
      }
  
      return this.findOne(
        tenantId,
        ratePlanId,
      );
    }
  
    // ============================================
    // ARCHIVE RATE PLAN
    // ============================================
  
    async archive(
      tenantId: string,
      ratePlanId: string,
    ) {
      await this.findOne(
        tenantId,
        ratePlanId,
      );
  
      await this.prisma.ratePlan.updateMany({
        where: {
          id: ratePlanId,
          tenantId,
        },
        data: {
          isActive: false,
        },
      });
  
      return {
        message: "Rate plan archived successfully.",
      };
    }
  }
  