
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { CreateDailyRateDto } from "./dto/create-daily-rate.dto.js";
  import { UpdateDailyRateDto } from "./dto/update-daily-rate.dto.js";
  import { QueryDailyRatesDto } from "./dto/query-daily-rates.dto.js";
  
  @Injectable()
  export class DailyRatesService {
    constructor(
      private readonly prisma: PrismaService,
    ) {}
  
    // ============================================
    // DATE HELPER
    // ============================================
  
    private toDatabaseDate(value: string): Date {
      const date = new Date(`${value}T00:00:00.000Z`);
  
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(
          "Invalid date provided.",
        );
      }
  
      return date;
    }
  
    // ============================================
    // VERIFY RATE PLAN
    // ============================================
  
    private async ensureRatePlanExists(
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
    // VERIFY DAILY RATE
    // ============================================
  
    private async ensureDailyRateExists(
      tenantId: string,
      ratePlanId: string,
      dailyRateId: string,
    ) {
      const dailyRate = await this.prisma.dailyRate.findFirst({
        where: {
          id: dailyRateId,
          tenantId,
          ratePlanId,
        },
        include: {
          ratePlan: true,
        },
      });
  
      if (!dailyRate) {
        throw new NotFoundException(
          "Daily rate not found.",
        );
      }
  
      return dailyRate;
    }
  
    // ============================================
    // VALIDATE STAY RESTRICTIONS
    // ============================================
  
    private validateStayRestrictions(
      minStayNights?: number | null,
      maxStayNights?: number | null,
    ) {
      if (
        minStayNights !== undefined &&
        minStayNights !== null &&
        minStayNights < 1
      ) {
        throw new BadRequestException(
          "Minimum stay must be at least one night.",
        );
      }
  
      if (
        maxStayNights !== undefined &&
        maxStayNights !== null &&
        maxStayNights < 1
      ) {
        throw new BadRequestException(
          "Maximum stay must be at least one night.",
        );
      }
  
      if (
        minStayNights != null &&
        maxStayNights != null &&
        minStayNights > maxStayNights
      ) {
        throw new BadRequestException(
          "Minimum stay cannot exceed maximum stay.",
        );
      }
    }
  
    // ============================================
    // CREATE DAILY RATE
    // ============================================
  
    async create(
      tenantId: string,
      ratePlanId: string,
      dto: CreateDailyRateDto,
    ) {
      const ratePlan = await this.ensureRatePlanExists(
        tenantId,
        ratePlanId,
      );
  
      this.validateStayRestrictions(
        dto.minStayNights,
        dto.maxStayNights,
      );
  
      const date = this.toDatabaseDate(dto.date);
  
      try {
        return await this.prisma.dailyRate.create({
          data: {
            tenantId,
            ratePlanId: ratePlan.id,
  
            date,
            price: dto.price,
  
            minStayNights: dto.minStayNights,
            maxStayNights: dto.maxStayNights,
  
            isClosed: dto.isClosed ?? false,
            closedToArrival: dto.closedToArrival ?? false,
            closedToDeparture: dto.closedToDeparture ?? false,
          },
          include: {
            ratePlan: true,
          },
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "A daily rate already exists for this date and rate plan.",
          );
        }
  
        throw error;
      }
    }
  
    // ============================================
    // GET DAILY RATES BY DATE RANGE
    // ============================================
  
    async findAll(
      tenantId: string,
      ratePlanId: string,
      query: QueryDailyRatesDto,
    ) {
      await this.ensureRatePlanExists(
        tenantId,
        ratePlanId,
      );
  
      const fromDate = this.toDatabaseDate(query.from);
      const toDate = this.toDatabaseDate(query.to);
  
      if (fromDate > toDate) {
        throw new BadRequestException(
          "The start date cannot be after the end date.",
        );
      }
  
      const page = query.page ?? 1;
      const limit = query.limit ?? 31;
      const skip = (page - 1) * limit;
  
      const where = {
        tenantId,
        ratePlanId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      };
  
      const [dailyRates, total] = await Promise.all([
        this.prisma.dailyRate.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            date: "asc",
          },
          include: {
            ratePlan: true,
          },
        }),
  
        this.prisma.dailyRate.count({
          where,
        }),
      ]);
  
      return {
        data: dailyRates,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        dateRange: {
          from: query.from,
          to: query.to,
        },
      };
    }
  
    // ============================================
    // GET ONE DAILY RATE
    // ============================================
  
    async findOne(
      tenantId: string,
      ratePlanId: string,
      dailyRateId: string,
    ) {
      return this.ensureDailyRateExists(
        tenantId,
        ratePlanId,
        dailyRateId,
      );
    }
  
    // ============================================
    // UPDATE DAILY RATE
    // ============================================
  
    async update(
      tenantId: string,
      ratePlanId: string,
      dailyRateId: string,
      dto: UpdateDailyRateDto,
    ) {
      const existingRate = await this.ensureDailyRateExists(
        tenantId,
        ratePlanId,
        dailyRateId,
      );
  
      const minStayNights =
        dto.minStayNights !== undefined
          ? dto.minStayNights
          : existingRate.minStayNights;
  
      const maxStayNights =
        dto.maxStayNights !== undefined
          ? dto.maxStayNights
          : existingRate.maxStayNights;
  
      this.validateStayRestrictions(
        minStayNights,
        maxStayNights,
      );
  
      await this.prisma.dailyRate.updateMany({
        where: {
          id: dailyRateId,
          tenantId,
          ratePlanId,
        },
        data: {
          ...(dto.date !== undefined
            ? { date: this.toDatabaseDate(dto.date) }
            : {}),
  
          ...(dto.price !== undefined
            ? { price: dto.price }
            : {}),
  
          ...(dto.minStayNights !== undefined
            ? { minStayNights: dto.minStayNights }
            : {}),
  
          ...(dto.maxStayNights !== undefined
            ? { maxStayNights: dto.maxStayNights }
            : {}),
  
          ...(dto.isClosed !== undefined
            ? { isClosed: dto.isClosed }
            : {}),
  
          ...(dto.closedToArrival !== undefined
            ? { closedToArrival: dto.closedToArrival }
            : {}),
  
          ...(dto.closedToDeparture !== undefined
            ? { closedToDeparture: dto.closedToDeparture }
            : {}),
        },
      });
  
      return this.findOne(
        tenantId,
        ratePlanId,
        dailyRateId,
      );
    }
  
    // ============================================
    // DELETE DAILY RATE
    // ============================================
  
    async remove(
      tenantId: string,
      ratePlanId: string,
      dailyRateId: string,
    ) {
      await this.ensureDailyRateExists(
        tenantId,
        ratePlanId,
        dailyRateId,
      );
  
      await this.prisma.dailyRate.deleteMany({
        where: {
          id: dailyRateId,
          tenantId,
          ratePlanId,
        },
      });
  
      return {
        message: "Daily rate deleted successfully.",
      };
    }
  }
  