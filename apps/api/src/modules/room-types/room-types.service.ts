import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";
import { CreateRoomTypeDto } from "./dto/create-room-type.dto";
import { UpdateRoomTypeDto } from "./dto/update-room-type.dto";
import { QueryRoomTypesDto } from "./dto/query-room-types.dto";

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, hotelId: string, dto: CreateRoomTypeDto) {
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        tenantId,
      },
    });

    if (!hotel) {
      throw new NotFoundException("Hotel not found");
    }

    try {
      return await this.prisma.roomType.create({
        data: {
          tenantId,
          hotelId,
          name: dto.name,
          code: dto.code.toUpperCase(),
          description: dto.description,
          maxAdults: dto.maxAdults ?? 2,
          maxChildren: dto.maxChildren ?? 0,
          basePrice: dto.basePrice ?? 0,
          size: dto.size,
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Room type code already exists");
      }

      throw error;
    }
  }

  async findAll(
    tenantId: string,
    hotelId: string,
    query: QueryRoomTypesDto,
  ) {
    const hotel = await this.prisma.hotel.findFirst({
      where: {
        id: hotelId,
        tenantId,
      },
      select: { id: true },
    });

    if (!hotel) {
      throw new NotFoundException("Hotel not found");
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);

    const where = {
      tenantId,
      hotelId,
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                code: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.roomType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.roomType.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, roomTypeId: string) {
    const roomType = await this.prisma.roomType.findFirst({
      where: {
        id: roomTypeId,
        tenantId,
      },
    });

    if (!roomType) {
      throw new NotFoundException("Room type not found");
    }

    return roomType;
  }

  async update(
    tenantId: string,
    roomTypeId: string,
    dto: UpdateRoomTypeDto,
  ) {
    await this.findOne(tenantId, roomTypeId);

    try {
      return await this.prisma.roomType.update({
        where: { id: roomTypeId },
        data: {
          ...dto,
          code: dto.code?.toUpperCase(),
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Room type code already exists");
      }

      throw error;
    }
  }

  async archive(tenantId: string, roomTypeId: string) {
    await this.findOne(tenantId, roomTypeId);

    try {
      return await this.prisma.roomType.delete({
        where: { id: roomTypeId },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "Room type cannot be removed while rooms or reservations still reference it.",
        );
      }

      throw error;
    }
  }
}