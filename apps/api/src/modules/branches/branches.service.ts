import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service.js";
import { CreateBranchDto } from "./dto/create-branch.dto.js";
import { UpdateBranchDto } from "./dto/update-branch.dto.js";

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureHotelExists(tenantId: string, hotelId: string) {
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        tenantId,
      },
    });

    if (!hotel) {
      throw new NotFoundException("Hotel not found.");
    }

    return hotel;
  }

  async create(tenantId: string, hotelId: string, dto: CreateBranchDto) {
    await this.ensureHotelExists(tenantId, hotelId);

    try {
      return await this.prisma.branch.create({
        data: {
          tenantId,
          hotelId,
          name: dto.name,
          code: dto.code.toUpperCase(),
          address: dto.address,
          city: dto.city,
          country: dto.country,
          postalCode: dto.postalCode,
          phone: dto.phone,
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "This branch code already exists for the hotel.",
        );
      }

      throw error;
    }
  }

  async findAll(tenantId: string, hotelId: string) {
    await this.ensureHotelExists(tenantId, hotelId);

    return this.prisma.branch.findMany({
      where: {
        hotelId,
        hotel: {
          tenantId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        hotel: {
          tenantId,
        },
      },
      include: {
        hotel: true,
      },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found.");
    }

    return branch;
  }

  async update(tenantId: string, branchId: string, dto: UpdateBranchDto) {
    await this.findOne(tenantId, branchId);

    return this.prisma.branch.update({
      where: {
        id: branchId,
      },
      data: {
        ...dto,
        code: dto.code?.toUpperCase(),
      },
    });
  }

  async archive(tenantId: string, branchId: string) {
    await this.findOne(tenantId, branchId);

    try {
      return await this.prisma.branch.delete({
        where: {
          id: branchId,
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "Branch cannot be removed while rooms or reservations still reference it.",
        );
      }

      throw error;
    }
  }
}