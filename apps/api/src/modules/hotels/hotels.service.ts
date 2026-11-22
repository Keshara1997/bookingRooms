import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  import { CreateHotelDto } from "./dto/create-hotel.dto.js";
  import { UpdateHotelDto } from "./dto/update-hotel.dto.js";
  
  @Injectable()
  export class HotelsService {
    constructor(private readonly prisma: PrismaService) {}

    private slugifyName(name: string): string {
      const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);

      return base.length > 0 ? base : "hotel";
    }
  
    async create(tenantId: string, dto: CreateHotelDto) {
      try {
        return await this.prisma.hotel.create({
          data: {
            tenantId,
            name: dto.name,
            slug: this.slugifyName(dto.name),
            description: dto.description,
            email: dto.email,
            phone: dto.phone,
            website: dto.website,
            starRating: dto.starRating,
            currency: dto.currency ?? "LKR",
            timezone: dto.timezone ?? "Asia/Colombo",
          },
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new ConflictException("A hotel with these details already exists.");
        }
  
        throw error;
      }
    }
  
    async findAll(tenantId: string) {
      return this.prisma.hotel.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        include: {
          branches: true,
        },
      });
    }
  
    async findOne(tenantId: string, hotelId: string) {
      const hotel = await this.prisma.hotel.findFirst({
        where: {
          id: hotelId,
          tenantId,
        },
        include: {
          branches: true,
        },
      });
  
      if (!hotel) {
        throw new NotFoundException("Hotel not found.");
      }
  
      return hotel;
    }
  
    async update(
      tenantId: string,
      hotelId: string,
      dto: UpdateHotelDto,
    ) {
      await this.findOne(tenantId, hotelId);
  
      const { name, ...rest } = dto;

      return this.prisma.hotel.update({
        where: { id: hotelId },
        data: {
          ...rest,
          ...(name !== undefined
            ? { name, slug: this.slugifyName(name) }
            : {}),
        },
      });
    }
  
    async archive(tenantId: string, hotelId: string) {
      await this.findOne(tenantId, hotelId);
  
      return this.prisma.hotel.update({
        where: { id: hotelId },
        data: {
          status: "INACTIVE",
        },
      });
    }
  }