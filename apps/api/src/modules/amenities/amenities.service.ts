import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service.js";
import { CreateAmenityDto } from "./dto/create-amenity.dto.js";
import { UpdateAmenityDto } from "./dto/update-amenity.dto.js";

@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAmenityDto) {
    try {
      return await this.prisma.amenity.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          icon: dto.icon?.trim(),
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
          "An amenity with this name already exists.",
        );
      }

      throw error;
    }
  }

  async findAll(tenantId: string) {
    return this.prisma.amenity.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async findOne(tenantId: string, amenityId: string) {
    const amenity = await this.prisma.amenity.findFirst({
      where: {
        id: amenityId,
        tenantId,
      },
    });

    if (!amenity) {
      throw new NotFoundException("Amenity not found.");
    }

    return amenity;
  }

  async update(
    tenantId: string,
    amenityId: string,
    dto: UpdateAmenityDto,
  ) {
    await this.findOne(tenantId, amenityId);

    try {
      return await this.prisma.amenity.update({
        where: { id: amenityId },
        data: {
          name: dto.name?.trim(),
          icon: dto.icon === null ? null : dto.icon?.trim(),
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
          "An amenity with this name already exists.",
        );
      }

      throw error;
    }
  }

  async remove(tenantId: string, amenityId: string) {
    await this.findOne(tenantId, amenityId);

    try {
      await this.prisma.amenity.delete({
        where: { id: amenityId },
      });

      return { deleted: true };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "Amenity cannot be removed while assigned to room types.",
        );
      }

      throw error;
    }
  }

  async setRoomTypeAmenities(
    tenantId: string,
    roomTypeId: string,
    amenityIds: string[],
  ) {
    const roomType = await this.prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        tenantId,
      },
      select: { id: true },
    });

    if (!roomType) {
      throw new NotFoundException("Room type not found.");
    }

    const amenities = await this.prisma.amenity.findMany({
      where: {
        tenantId,
        id: { in: amenityIds },
      },
      select: { id: true },
    });

    if (amenities.length !== amenityIds.length) {
      throw new NotFoundException(
        "One or more amenities were not found for this tenant.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.roomTypeAmenity.deleteMany({
        where: { roomTypeId },
      }),
      this.prisma.roomTypeAmenity.createMany({
        data: amenityIds.map((amenityId) => ({
          roomTypeId,
          amenityId,
        })),
        skipDuplicates: true,
      }),
    ]);

    return this.getRoomTypeAmenities(tenantId, roomTypeId);
  }

  async getRoomTypeAmenities(tenantId: string, roomTypeId: string) {
    const roomType = await this.prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        tenantId,
      },
      select: { id: true },
    });

    if (!roomType) {
      throw new NotFoundException("Room type not found.");
    }

    const links = await this.prisma.roomTypeAmenity.findMany({
      where: { roomTypeId },
      include: {
        amenity: true,
      },
      orderBy: {
        amenity: { name: "asc" },
      },
    });

    return links.map((link) => link.amenity);
  }
}