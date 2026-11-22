
import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { CreateRoomDto } from "./dto/create-room.dto.js";
  import { UpdateRoomDto } from "./dto/update-room.dto.js";
  import { QueryRoomsDto } from "./dto/query-rooms.dto.js";
  import { UpdateRoomStatusDto } from "./dto/update-room-status.dto.js";
  
  @Injectable()
  export class RoomsService {
    constructor(private readonly prisma: PrismaService) {}
  
    /**
     * Check that a branch belongs to the authenticated tenant.
     */
    private async ensureBranchExists(
      tenantId: string,
      branchId: string,
    ) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          tenantId,
        },
        select: {
          id: true,
          tenantId: true,
          hotelId: true,
        },
      });
  
      if (!branch) {
        throw new NotFoundException("Branch not found.");
      }
  
      return branch;
    }
  
    /**
     * Check that a room type belongs to the same tenant and hotel
     * as the selected branch.
     */
    private async ensureRoomTypeExists(
      tenantId: string,
      hotelId: string,
      roomTypeId: string,
    ) {
      const roomType = await this.prisma.roomType.findFirst({
        where: {
          id: roomTypeId,
          tenantId,
          hotelId,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
  
      if (!roomType) {
        throw new NotFoundException(
          "Room type not found for this hotel.",
        );
      }
  
      return roomType;
    }
  
    /**
     * Create a room inside a branch.
     */
    async create(
      tenantId: string,
      branchId: string,
      dto: CreateRoomDto,
    ) {
      const branch = await this.ensureBranchExists(
        tenantId,
        branchId,
      );
  
      await this.ensureRoomTypeExists(
        tenantId,
        branch.hotelId,
        dto.roomTypeId,
      );
  
      try {
        return await this.prisma.room.create({
          data: {
            tenantId,
            branchId,
            roomTypeId: dto.roomTypeId,
            roomNumber: dto.roomNumber.trim(),
            floor: dto.floor,
            status: "AVAILABLE",
          },
          include: {
            roomType: true,
            branch: true,
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
            "This room number already exists in the branch.",
          );
        }
  
        throw error;
      }
    }
  
    /**
     * Return paginated rooms for a branch.
     */
    async findAll(
      tenantId: string,
      branchId: string,
      query: QueryRoomsDto,
    ) {
      await this.ensureBranchExists(tenantId, branchId);
  
      const page = query.page ?? 1;
      const limit = Math.min(query.limit ?? 10, 100);
  
      const where = {
        tenantId,
        branchId,
  
        ...(query.status
          ? {
              status: query.status,
            }
          : {}),
  
        ...(query.search
          ? {
              roomNumber: {
                contains: query.search.trim(),
                mode: "insensitive" as const,
              },
            }
          : {}),
      };
  
      const [items, total] = await this.prisma.$transaction([
        this.prisma.room.findMany({
          where,
          include: {
            roomType: true,
            branch: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            roomNumber: "asc",
          },
        }),
  
        this.prisma.room.count({
          where,
        }),
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
  
    /**
     * Find one room belonging to the authenticated tenant.
     */
    async findOne(
      tenantId: string,
      roomId: string,
    ) {
      const room = await this.prisma.room.findFirst({
        where: {
          id: roomId,
          tenantId,
        },
        include: {
          roomType: true,
          branch: {
            include: {
              hotel: true,
            },
          },
        },
      });
  
      if (!room) {
        throw new NotFoundException("Room not found.");
      }
  
      return room;
    }
  
    /**
     * Update room details.
     */
    async update(
      tenantId: string,
      roomId: string,
      dto: UpdateRoomDto,
    ) {
      const existingRoom = await this.findOne(
        tenantId,
        roomId,
      );
  
      if (dto.roomTypeId) {
        await this.ensureRoomTypeExists(
          tenantId,
          existingRoom.branch.hotelId,
          dto.roomTypeId,
        );
      }
  
      try {
        const result = await this.prisma.room.updateMany({
          where: {
            id: roomId,
            tenantId,
          },
          data: {
            ...(dto.roomTypeId
              ? { roomTypeId: dto.roomTypeId }
              : {}),
  
            ...(dto.roomNumber !== undefined
              ? { roomNumber: dto.roomNumber.trim() }
              : {}),
  
            ...(dto.floor !== undefined
              ? { floor: dto.floor }
              : {}),
          },
        });
  
        if (result.count === 0) {
          throw new NotFoundException("Room not found.");
        }
  
        return this.findOne(tenantId, roomId);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "This room number already exists in the branch.",
          );
        }
  
        throw error;
      }
    }
  
    /**
     * Change room status.
     */
    async updateStatus(
      tenantId: string,
      roomId: string,
      dto: UpdateRoomStatusDto,
    ) {
      await this.findOne(tenantId, roomId);
  
      const result = await this.prisma.room.updateMany({
        where: {
          id: roomId,
          tenantId,
        },
        data: {
          status: dto.status,
        },
      });
  
      if (result.count === 0) {
        throw new NotFoundException("Room not found.");
      }
  
      return this.findOne(tenantId, roomId);
    }
  
    /**
     * Permanently remove a room.
     * Removal is blocked if reservations or other records reference it.
     */
    async remove(
      tenantId: string,
      roomId: string,
    ) {
      await this.findOne(tenantId, roomId);
  
      try {
        const result = await this.prisma.room.deleteMany({
          where: {
            id: roomId,
            tenantId,
          },
        });
  
        if (result.count === 0) {
          throw new NotFoundException("Room not found.");
        }
  
        return {
          message: "Room removed successfully.",
        };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2003"
        ) {
          throw new ConflictException(
            "Room cannot be removed while reservations or other records reference it.",
          );
        }
  
        throw error;
      }
    }
  }
  